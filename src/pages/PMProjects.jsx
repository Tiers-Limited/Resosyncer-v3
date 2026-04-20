import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Zap,
  Edit2,
  Search,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
  MoreHorizontal,
  Flag,
  Sparkles,
  GripVertical,
  ArrowRight,
  Inbox,
  AlertTriangle,
  TrendingUp,
  X,
  ChevronRight,
  Settings,
  Filter,
  Hash,
  RefreshCw,
  BookOpen,
  Bug,
  CheckSquare,
  GitBranch,
  ChevronsRight,
  Paperclip,
  MessageSquare,
  History,
  Send,
  Upload,
  Eye,
  Download,
  Trash2,
  User,
  Link2,
  AtSign,
  ChevronLeft,
  ExternalLink,
  Activity,
  Bell,
} from "lucide-react";
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Tooltip,
  Progress,
  Modal,
  Spin,
  Avatar,
  Divider,
  Badge,
  Popover,
  Tabs,
} from "antd";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { supabase } from "../lib/supabase";
import TicketDetailsModal from "../components/TicketDetailsModal";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Option } = Select;

const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// ---
// HIERARCHY
// ---
const HIERARCHY = {
  epic: {
    level: 0,
    canHaveParent: false,
    showOnBoard: false,
    showInBacklog: true,
  },
  story: {
    level: 1,
    canHaveParent: true,
    parentTypes: ["epic"],
    showOnBoard: true,
    showInBacklog: true,
  },
  task: {
    level: 2,
    canHaveParent: true,
    parentTypes: ["epic", "story"],
    showOnBoard: true,
    showInBacklog: true,
  },
  bug: {
    level: 2,
    canHaveParent: true,
    parentTypes: ["epic", "story"],
    showOnBoard: true,
    showInBacklog: true,
  },
  subtask: {
    level: 3,
    canHaveParent: true,
    parentTypes: ["story", "task", "bug"],
    showOnBoard: false,
    showInBacklog: false,
  },
};

const PRIORITY = {
  low: { label: "Low", color: "#6b7280", bg: "#f3f4f6", dot: "#94a3b8" },
  medium: { label: "Medium", color: "#3b82f6", bg: "#eff6ff", dot: "#3b82f6" },
  high: { label: "High", color: "#f97316", bg: "#fff7ed", dot: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
};

const TICKET_TYPE = {
  epic: {
    label: "Epic",
    color: "#7c3aed",
    icon: <Layers size={10} />,
    bg: "#ede9fe",
    description: "Large body of work spanning multiple sprints",
  },
  story: {
    label: "Story",
    color: "#059669",
    icon: <BookOpen size={10} />,
    bg: "#d1fae5",
    description: "User-facing feature or requirement",
  },
  task: {
    label: "Task",
    color: "#003467",
    icon: <CheckSquare size={10} />,
    bg: "#e8f0fe",
    description: "Technical work item",
  },
  bug: {
    label: "Bug",
    color: "#ef4444",
    icon: <Bug size={10} />,
    bg: "#fee2e2",
    description: "Something broken that needs fixing",
  },
  subtask: {
    label: "Subtask",
    color: "#64748b",
    icon: <ChevronsRight size={10} />,
    bg: "#f1f5f9",
    description: "Small piece of work under a parent ticket",
  },
};

const TICKET_STATUS = [
  {
    key: "open",
    label: "To Do",
    color: "#44546f",
    bg: "#f0f4f8",
    border: "#dde3ec",
    headerBg: "#e4ecf5",
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "#0c66e4",
    bg: "#e9f2ff",
    border: "#b8d0f5",
    headerBg: "#cce0ff",
  },
  {
    key: "completed",
    label: "Done",
    color: "#22a06b",
    bg: "#dcfff1",
    border: "#abe5c7",
    headerBg: "#baf3db",
  },
  {
    key: "closed",
    label: "Closed",
    color: "#626f86",
    bg: "#f1f2f4",
    border: "#d1d5db",
    headerBg: "#e2e4e9",
  },
];

const PROJECT_STATUS = [
  {
    key: "not_started",
    label: "Not Started",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "testing",
    label: "Testing",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#a7f3d0",
  },
];

// ---
// HELPERS
// ---
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

const fmtDate = (d) => (d ? dayjs(d).format("MMM D") : "--");
const fmtTime = (d) => (d ? dayjs(d).fromNow() : "");

const sprintProgress = (tickets = []) => {
  if (!tickets.length) return 0;
  const done = tickets.filter(
    (t) => t.status === "completed" || t.status === "closed",
  ).length;
  return Math.round((done / tickets.length) * 100);
};

// ---
// FIX 1: ROBUST MULTI-ASSIGNEE HELPER
// Handles JSONB returned as string, array, or null
// Falls back to legacy assigned_to (single ID)
// ---
const getAssigneeIds = (ticket) => {
  if (
    ticket?.assigned_to_ids !== undefined &&
    ticket?.assigned_to_ids !== null
  ) {
    let ids = ticket.assigned_to_ids;
    // Supabase JSONB can come back as a string in some client versions
    if (typeof ids === "string") {
      try {
        ids = JSON.parse(ids);
      } catch {
        ids = [];
      }
    }
    if (Array.isArray(ids) && ids.length > 0) return ids;
  }
  // Legacy fallback: single assigned_to
  if (ticket?.assigned_to) return [ticket.assigned_to];
  return [];
};

// ---
// AI
// ---
const analyzeTicketWithAI = async (title, description = "", type = "task") => {
  const systemPrompt = `You are a senior engineering manager. Analyze ticket titles and descriptions to suggest priority and story points.
Respond ONLY with valid JSON: {"priority":"low|medium|high|urgent","story_points":1|2|3|5|8|13|21,"reasoning":"brief explanation under 20 words"}`;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Type: ${type}\nTitle: ${title}\nDescription: ${description || "No description"}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 200,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("AI error:", err);
    return null;
  }
};

const PLAN_PRIORITY = new Set(["low", "medium", "high", "urgent"]);
const PLAN_STATUS = new Set(["open", "in_progress", "completed", "closed"]);
const PLAN_TYPE = new Set(["epic", "story", "task", "bug", "subtask"]);
const PLAN_POINTS = new Set([0, 1, 2, 3, 5, 8, 13, 21]);

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsText(file);
  });

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsArrayBuffer(file);
  });

const readPlannerFileText = async (file) => {
  const ext = (file?.name || "").toLowerCase().split(".").pop();
  const textFormats = new Set(["txt", "md", "json", "csv"]);
  const binaryFormats = new Set(["pdf", "doc", "docx"]);
  const allowed = new Set([...textFormats, ...binaryFormats]);

  if (!allowed.has(ext)) {
    throw new Error(
      "Unsupported file. Use md, pdf, doc, docx, txt, json, or csv for AI planning.",
    );
  }

  if (textFormats.has(ext)) {
    return await readFileAsText(file);
  }

  const raw = await readFileAsArrayBuffer(file);
  const bytes = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array();
  const preview = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 1600)))
    .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [
    `File Name: ${file.name}`,
    `File Type: ${ext.toUpperCase()}`,
    `File Size: ${Math.round((file.size || 0) / 1024)} KB`,
    preview ? `Extracted Preview: ${preview}` : "Extracted Preview: unavailable (binary file).",
  ].join("\n");
};

const normalizeAiPlan = (rawPlan) => {
  const rawSprints = Array.isArray(rawPlan?.sprints) ? rawPlan.sprints : [];
  const rawTickets = Array.isArray(rawPlan?.tickets) ? rawPlan.tickets : [];

  const sprints = rawSprints
    .map((s, i) => ({
      name: String(s?.name || `Sprint ${i + 1}`).slice(0, 120),
      goal: s?.goal ? String(s.goal).slice(0, 600) : null,
      status: s?.status === "active" || s?.status === "completed" ? s.status : "planning",
      start_date: s?.start_date || null,
      end_date: s?.end_date || null,
    }))
    .filter((s) => s.name.trim().length > 0);

  const tickets = rawTickets
    .map((t, i) => {
      const type = PLAN_TYPE.has(t?.ticket_type) ? t.ticket_type : "task";
      const status = PLAN_STATUS.has(t?.status) ? t.status : "open";
      const priority = PLAN_PRIORITY.has(t?.priority) ? t.priority : "medium";
      const storyPoints = PLAN_POINTS.has(Number(t?.story_points))
        ? Number(t.story_points)
        : 0;
      return {
        key: String(t?.key || `T${i + 1}`).slice(0, 40),
        title: String(t?.title || "").trim().slice(0, 240),
        description: t?.description ? String(t.description).slice(0, 3000) : "",
        ticket_type: type,
        status,
        priority,
        story_points: storyPoints,
        sprint_name: t?.sprint_name ? String(t.sprint_name).trim() : null,
        parent_key: t?.parent_key ? String(t.parent_key).trim() : null,
      };
    })
    .filter((t) => t.title.length > 0);

  return { sprints, tickets };
};

const generateProjectPlanWithAI = async ({ projectName, brief, extraText }) => {
  const systemPrompt = `You are a senior Agile delivery lead.
Create a precise execution plan for software delivery.
Respond ONLY JSON with this schema:
{
  "sprints":[
    {"name":"Sprint 1","goal":"...","status":"planning|active|completed","start_date":"YYYY-MM-DD or null","end_date":"YYYY-MM-DD or null"}
  ],
  "tickets":[
    {"key":"E1","title":"...","description":"...","ticket_type":"epic|story|task|bug|subtask","status":"open|in_progress|completed|closed","priority":"low|medium|high|urgent","story_points":0|1|2|3|5|8|13|21,"sprint_name":"Sprint 1 or null","parent_key":"E1 or null"}
  ]
}
Rules:
- Include 2-4 sprints when project scope is medium/large, otherwise 1-2.
- Tickets must be actionable and implementation-ready.
- Use epics/stories/tasks hierarchy when appropriate.
- Use parent_key only when parent exists in tickets key list.
- Backlog items can have sprint_name null.
- Keep titles concise and unambiguous.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Project: ${projectName}\nBrief:\n${brief}\n\nReference Material:\n${extraText || "None"}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2200,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "AI planning request failed");
  }

  const data = await res.json();
  let text = data?.choices?.[0]?.message?.content || "";
  text = text.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse((jsonMatch ? jsonMatch[0] : text).trim());
  return normalizeAiPlan(parsed);
};

// ---
// SUB-COMPONENTS
// ---
const UserAvatar = ({ name = "", image, size = 24 }) => (
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
        fontWeight: 700,
        border: "2px solid #fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.15)",
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

// Stacked avatars for multi-assignee display
const MultiAssigneeAvatars = ({
  assigneeIds = [],
  projectAssignees = [],
  size = 20,
  max = 3,
}) => {
  const profiles = assigneeIds
    .map((id) => projectAssignees.find((a) => a.profiles?.id === id)?.profiles)
    .filter(Boolean);

  if (profiles.length === 0) return null;

  const visible = profiles.slice(0, max);
  const overflow = profiles.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((p, i) => (
        <div
          key={p.id}
          style={{
            marginLeft: i > 0 ? -(size * 0.3) : 0,
            zIndex: visible.length - i,
          }}
        >
          <UserAvatar
            name={p.full_name || "?"}
            image={p.user_photo}
            size={size}
          />
        </div>
      ))}
      {overflow > 0 && (
        <Tooltip
          title={profiles
            .slice(max)
            .map((p) => p.full_name)
            .join(", ")}
        >
          <div
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#e5e7eb",
              border: "2px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: size * 0.32,
              fontWeight: 700,
              color: "#6b7280",
              marginLeft: -(size * 0.3),
              flexShrink: 0,
            }}
          >
            +{overflow}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const PriorityIcon = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  const iconMap = {
    low: <ChevronDown size={10} />,
    medium: <ChevronsRight size={10} />,
    high: <ChevronUp size={10} />,
    urgent: <AlertTriangle size={10} />,
  };
  return (
    <Tooltip title={`Priority: ${p.label}`}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 10,
          fontWeight: 700,
          color: p.color,
          padding: "2px 6px",
          borderRadius: 3,
          background: p.bg,
          border: `1px solid ${p.color}25`,
          lineHeight: 1,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {iconMap[priority] || <ChevronsRight size={10} />}
        </span>{" "}
        {p.label}
      </span>
    </Tooltip>
  );
};

const TypeChip = ({ type, size = "normal" }) => {
  const t = TICKET_TYPE[type] || TICKET_TYPE.task;
  const small = size === "small";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: small ? 9 : 10,
        fontWeight: 700,
        padding: small ? "1px 5px" : "2px 7px",
        borderRadius: 3,
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.color}30`,
        lineHeight: 1.4,
      }}
    >
      {t.icon} {t.label}
    </span>
  );
};

const StatusBadge = ({ status, dark = false }) => {
  const s = TICKET_STATUS.find((x) => x.key === status) || TICKET_STATUS[0];
  const darkStatus = {
    open: { bg: "#273141", border: "#3c4b61", color: "#cbd5e1" },
    in_progress: { bg: "#1f3a66", border: "#2d5189", color: "#93c5fd" },
    completed: { bg: "#1f3a2f", border: "#2f5a46", color: "#86efac" },
    closed: { bg: "#2b2f39", border: "#3f4654", color: "#c4c9d4" },
  }[s.key];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 3,
        color: dark ? darkStatus?.color || "#d1d5db" : s.color,
        background: dark ? darkStatus?.bg || "#2b2f39" : s.bg,
        border: `1px solid ${dark ? darkStatus?.border || "#3f4654" : s.border}`,
      }}
    >
      {s.label}
    </span>
  );
};

// ---
// SKELETON LOADING
// ---
const SkeletonPulse = ({
  width = "100%",
  height = 16,
  borderRadius = 4,
  dark = false,
  style = {},
}) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: dark
        ? "linear-gradient(90deg,#22252d 25%,#2d313b 50%,#22252d 75%)"
        : "linear-gradient(90deg,#f0f2f5 25%,#e4e8ed 50%,#f0f2f5 75%)",
      backgroundSize: "200% 100%",
      animation: "skeletonShimmer 1.4s ease-in-out infinite",
      ...style,
    }}
  />
);

const SkeletonBoard = ({ dark = false }) => (
  <div>
    {[1, 2].map((i) => (
      <div key={i} style={{ marginBottom: 28 }}>
        <SkeletonPulse
          dark={dark}
          height={52}
          borderRadius={8}
          style={{ marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3, 4].map((j) => (
            <div key={j} style={{ flex: 1, minWidth: 0 }}>
              <SkeletonPulse
                dark={dark}
                height={36}
                borderRadius={4}
                style={{ marginBottom: 8 }}
              />
              {[1, 2, 3].map((k) => (
                <SkeletonPulse
                  key={k}
                  dark={dark}
                  height={52}
                  borderRadius={6}
                  style={{ marginBottom: 4 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SkeletonBacklog = ({ dark = false }) => (
  <div
    style={{
      background: dark ? "#1a1b1f" : "#fff",
      borderRadius: 8,
      border: dark ? "1px solid #2a2d36" : "1px solid #dde3ec",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "10px 14px",
        borderBottom: dark ? "1px solid #2a2d36" : "1px solid #f1f2f4",
        background: dark ? "#17181c" : "#fafafa",
      }}
    >
      <SkeletonPulse dark={dark} width={120} height={18} />
    </div>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: dark ? "1px solid #242833" : "1px solid #f8fafc",
        }}
      >
        <SkeletonPulse dark={dark} width={12} height={12} borderRadius={2} />
        <SkeletonPulse dark={dark} width={60} height={18} borderRadius={3} />
        <SkeletonPulse dark={dark} height={14} style={{ flex: 1 }} />
        <SkeletonPulse dark={dark} width={55} height={18} borderRadius={3} />
        <SkeletonPulse dark={dark} width={55} height={18} borderRadius={3} />
        <SkeletonPulse dark={dark} width={24} height={24} borderRadius="50%" />
      </div>
    ))}
  </div>
);

// ---
// TICKET DETAIL MODAL (Jira-style)
// ---
const TicketDetailModal = ({
  ticket,
  allTickets,
  sprints,
  project,
  profile,
  onClose,
  onUpdate,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("comments");
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleVal, setTitleVal] = useState(ticket?.title || "");
  const [descVal, setDescVal] = useState(ticket?.description || "");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(ticket?.status || "open");
  const [currentPriority, setCurrentPriority] = useState(
    ticket?.priority || "medium",
  );
  // FIX: always initialise as array
  const [currentAssigneeIds, setCurrentAssigneeIds] = useState(
    getAssigneeIds(ticket),
  );
  const fileInputRef = useRef();

  const parent = ticket?.parent_id
    ? allTickets.find((t) => t.id === ticket.parent_id)
    : null;
  const subtasks = allTickets.filter(
    (t) => t.parent_id === ticket?.id && t.ticket_type === "subtask",
  );

  useEffect(() => {
    if (ticket?.id) {
      fetchComments();
      fetchAttachments();
      fetchHistory();
      setTitleVal(ticket.title || "");
      setDescVal(ticket.description || "");
      setCurrentStatus(ticket.status || "open");
      setCurrentPriority(ticket.priority || "medium");
      setCurrentAssigneeIds(getAssigneeIds(ticket));
    }
  }, [ticket?.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*, profiles:user_id(id,full_name,user_photo)")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (!error) setComments(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingComments(false);
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

  const addComment = async () => {
    if (!newComment.trim()) return;
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
      fetchComments();
      await logHistory("comment_added", "", "Added a comment");
    } catch (e) {
      message.error("Failed to add comment");
    }
    setSubmittingComment(false);
  };

  const logHistory = async (field, oldVal, newVal) => {
    try {
      await supabase.from("ticket_history").insert([
        {
          ticket_id: ticket.id,
          changed_by: profile?.id,
          field_name: field,
          old_value: String(oldVal || ""),
          new_value: String(newVal || ""),
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateField = async (field, value, oldValue) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ [field]: value })
        .eq("id", ticket.id);
      if (error) throw error;
      await logHistory(field, oldValue, value);
      if (onUpdate) onUpdate({ ...ticket, [field]: value });
      onRefresh?.();
      message.success("Updated");
    } catch (e) {
      message.error("Update failed");
    }
  };

  const handleStatusChange = async (val) => {
    await updateField("status", val, currentStatus);
    setCurrentStatus(val);
  };

  const handlePriorityChange = async (val) => {
    await updateField("priority", val, currentPriority);
    setCurrentPriority(val);
  };

  // FIX: properly save multi-assignee array
  const handleAssigneesChange = async (ids) => {
    const idsArray = Array.isArray(ids) ? ids : [];
    setCurrentAssigneeIds(idsArray);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          assigned_to_ids: idsArray,
          assigned_to: idsArray[0] || null, // keep legacy column in sync
        })
        .eq("id", ticket.id);
      if (error) throw error;
      await logHistory(
        "assigned_to_ids",
        currentAssigneeIds.join(","),
        idsArray.join(","),
      );
      if (onUpdate)
        onUpdate({
          ...ticket,
          assigned_to_ids: idsArray,
          assigned_to: idsArray[0] || null,
        });
      onRefresh?.();
      message.success("Assignees updated");
    } catch (e) {
      message.error("Failed to update assignees");
    }
  };

  const handleTitleSave = async () => {
    if (titleVal.trim() === ticket.title) {
      setEditingTitle(false);
      return;
    }
    await updateField("title", titleVal.trim(), ticket.title);
    setEditingTitle(false);
  };

  const handleDescSave = async () => {
    await updateField("description", descVal, ticket.description);
    setEditingDesc(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `tickets/${ticket.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("attachments")
        .upload(path, file);
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("ticket_attachments")
        .insert([
          {
            ticket_id: ticket.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: profile?.id,
            storage_path: path,
          },
        ]);
      if (dbErr) throw dbErr;
      await logHistory("attachment_added", "", file.name);
      fetchAttachments();
      message.success("File uploaded");
    } catch (e) {
      message.error("Upload failed: " + e.message);
    }
    setUploading(false);
  };

  const deleteAttachment = async (att) => {
    try {
      await supabase.storage.from("attachments").remove([att.storage_path]);
      await supabase.from("ticket_attachments").delete().eq("id", att.id);
      fetchAttachments();
      message.success("Deleted");
    } catch (e) {
      message.error("Delete failed");
    }
  };

  const isImage = (type) => type?.startsWith("image/");
  const formatSize = (bytes) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
      : bytes > 1024
        ? `${Math.round(bytes / 1024)}KB`
        : `${bytes}B`;

  const historyIcon = (field) => {
    const map = {
      status: <Activity size={12} />,
      priority: <Flag size={12} />,
      title: <Edit2 size={12} />,
      description: <Edit2 size={12} />,
      assigned_to: <User size={12} />,
      assigned_to_ids: <Users size={12} />,
      comment_added: <MessageSquare size={12} />,
      attachment_added: <Paperclip size={12} />,
    };
    return map[field] || <History size={12} />;
  };

  const historyLabel = (item) => {
    if (item.field_name === "comment_added") return "added a comment";
    if (item.field_name === "attachment_added")
      return `attached ${item.new_value}`;
    if (item.field_name === "status")
      return `changed status from "${item.old_value}" to "${item.new_value}"`;
    if (item.field_name === "priority")
      return `changed priority from "${item.old_value}" to "${item.new_value}"`;
    if (
      item.field_name === "assigned_to" ||
      item.field_name === "assigned_to_ids"
    )
      return "changed assignees";
    return `updated ${item.field_name}`;
  };

  const currentSprint = sprints?.find((s) => s.id === ticket?.sprint_id);

  // Get project assignees safely
  const projectAssignees = project?.project_assignees || [];

  return (
    <Modal
      open={!!ticket}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20, maxWidth: 1100 }}
      styles={{
        content: { padding: 0, borderRadius: 12, overflow: "hidden" },
        mask: { background: "rgba(0,0,0,.6)" },
      }}
      closable={false}
    >
      {ticket && (
        <div style={{ display: "flex", height: "85vh", minHeight: 600 }}>
          {/* --- LEFT PANEL --- */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 28px",
              borderRight: "1px solid #f1f5f9",
            }}
          >
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {parent && (
                <>
                  <TypeChip type={parent.ticket_type} size="small" />
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {parent.title}
                  </span>
                  <ChevronRight size={10} color="#d1d5db" />
                </>
              )}
              <TypeChip type={ticket.ticket_type} />
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "monospace",
                  fontWeight: 600,
                }}
              >
                #{String(ticket.id).slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Title */}
            {editingTitle ? (
              <div style={{ marginBottom: 16 }}>
                <input
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave();
                    if (e.key === "Escape") {
                      setEditingTitle(false);
                      setTitleVal(ticket.title);
                    }
                  }}
                  autoFocus
                  style={{
                    width: "100%",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0f172a",
                    border: "2px solid #6366f1",
                    borderRadius: 6,
                    padding: "6px 10px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={handleTitleSave}
                    style={{
                      background: "#6366f1",
                      border: "none",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitle(false);
                      setTitleVal(ticket.title);
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      color: "#64748b",
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 16,
                  lineHeight: 1.35,
                  cursor: "text",
                  padding: "4px 6px",
                  borderRadius: 5,
                  margin: "0 -6px 16px",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {ticket.title}
              </h1>
            )}

            {/* Status row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <Select
                value={currentStatus}
                onChange={handleStatusChange}
                size="small"
                style={{ width: 140 }}
                popupMatchSelectWidth={false}
              >
                {TICKET_STATUS.map((s) => (
                  <Option key={s.key} value={s.key}>
                    <span
                      style={{ color: s.color, fontWeight: 600, fontSize: 12 }}
                    >
                      {s.label}
                    </span>
                  </Option>
                ))}
              </Select>
              <PriorityIcon priority={currentPriority} />
              {ticket.story_points > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontWeight: 600,
                  }}
                >
                  {ticket.story_points} pts
                </span>
              )}
              {currentSprint && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Zap size={9} /> {currentSprint.name}
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Description
              </div>
              {editingDesc ? (
                <div>
                  <TextArea
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    rows={5}
                    style={{
                      fontSize: 13,
                      borderColor: "#6366f1",
                      borderRadius: 6,
                    }}
                    placeholder="Add a description"
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      onClick={handleDescSave}
                      style={{
                        background: "#6366f1",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: 5,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingDesc(false);
                        setDescVal(ticket.description || "");
                      }}
                      style={{
                        background: "#f1f5f9",
                        border: "none",
                        color: "#64748b",
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 5,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  style={{
                    minHeight: 40,
                    fontSize: 13,
                    color: ticket.description ? "#374151" : "#adb5bd",
                    lineHeight: 1.6,
                    cursor: "text",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid transparent",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {ticket.description || "Click to add a description"}
                </div>
              )}
            </div>

            {/* Subtasks */}
            {subtasks.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Child Issues (
                  {
                    subtasks.filter(
                      (s) => s.status === "completed" || s.status === "closed",
                    ).length
                  }
                  /{subtasks.length})
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {subtasks.map((st, i) => (
                    <div
                      key={st.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderBottom:
                          i < subtasks.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                        background:
                          st.status === "completed" || st.status === "closed"
                            ? "#f9fafb"
                            : "#fff",
                      }}
                    >
                      {st.status === "completed" || st.status === "closed" ? (
                        <CheckCircle2 size={14} color="#22a06b" />
                      ) : (
                        <Circle size={14} color="#d1d5db" />
                      )}
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color:
                            st.status === "completed" || st.status === "closed"
                              ? "#9ca3af"
                              : "#374151",
                          textDecoration:
                            st.status === "completed" || st.status === "closed"
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {st.title}
                      </span>
                      <StatusBadge status={st.status} />
                    </div>
                  ))}
                </div>
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
                    gap: 5,
                    padding: "8px 16px",
                    border: "none",
                    borderBottom:
                      activeTab === tab.key
                        ? "2px solid #0c66e4"
                        : "2px solid transparent",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeTab === tab.key ? "#0c66e4" : "#64748b",
                    transition: "all .15s",
                    marginBottom: -1,
                  }}
                >
                  {tab.icon} {tab.label}
                  {tab.count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background:
                          activeTab === tab.key ? "#e9f2ff" : "#f1f5f9",
                        color: activeTab === tab.key ? "#0c66e4" : "#64748b",
                        padding: "1px 5px",
                        borderRadius: 99,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* COMMENTS */}
            {activeTab === "comments" && (
              <div>
                {loadingComments ? (
                  <Spin size="small" />
                ) : comments.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "#9ca3af",
                      fontSize: 12,
                    }}
                  >
                    No comments yet. Be the first!
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        style={{ display: "flex", gap: 10, marginBottom: 16 }}
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
                                fontWeight: 700,
                                color: "#1e293b",
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
                              color: "#374151",
                              background: "#f8fafc",
                              borderRadius: 6,
                              padding: "8px 12px",
                              border: "1px solid #e5e7eb",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {c.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <UserAvatar
                    name={profile?.full_name || "Me"}
                    image={profile?.user_photo}
                    size={28}
                  />
                  <div style={{ flex: 1 }}>
                    <TextArea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment (Ctrl+Enter to submit)"
                      rows={3}
                      style={{
                        fontSize: 13,
                        borderRadius: 6,
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
                        marginTop: 6,
                      }}
                    >
                      <button
                        onClick={addComment}
                        disabled={submittingComment || !newComment.trim()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          background: newComment.trim() ? "#0c66e4" : "#e5e7eb",
                          border: "none",
                          color: newComment.trim() ? "#fff" : "#9ca3af",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 14px",
                          borderRadius: 5,
                          cursor: newComment.trim() ? "pointer" : "not-allowed",
                          transition: "all .15s",
                        }}
                      >
                        <Send size={12} />{" "}
                        {submittingComment ? "Saving" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ATTACHMENTS */}
            {activeTab === "attachments" && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f0f4f8",
                      border: "1.5px dashed #b0b8c4",
                      color: "#44546f",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "8px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all .15s",
                      width: "100%",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0c66e4";
                      e.currentTarget.style.color = "#0c66e4";
                      e.currentTarget.style.background = "#e9f2ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#b0b8c4";
                      e.currentTarget.style.color = "#44546f";
                      e.currentTarget.style.background = "#f0f4f8";
                    }}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw
                          size={13}
                          style={{ animation: "spin 1s linear infinite" }}
                        />{" "}
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> Attach a file
                      </>
                    )}
                  </button>
                </div>
                {attachments.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "#9ca3af",
                      fontSize: 12,
                    }}
                  >
                    No attachments yet
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(180px,1fr))",
                      gap: 8,
                    }}
                  >
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#fafafa",
                        }}
                      >
                        {isImage(att.file_type) ? (
                          <div
                            style={{
                              height: 100,
                              overflow: "hidden",
                              background: "#f1f5f9",
                            }}
                          >
                            <img
                              src={att.file_url}
                              alt={att.file_name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: 100,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#f1f5f9",
                            }}
                          >
                            <Paperclip size={28} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ padding: "8px 10px" }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#374151",
                              marginBottom: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {att.file_name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              marginBottom: 6,
                            }}
                          >
                            {formatSize(att.file_size)} -{" "}
                            {fmtTime(att.created_at)}
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 3,
                                background: "#e9f2ff",
                                color: "#0c66e4",
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "4px",
                                borderRadius: 4,
                                textDecoration: "none",
                              }}
                            >
                              <Eye size={10} /> View
                            </a>
                            <button
                              onClick={() => deleteAttachment(att)}
                              style={{
                                background: "#fee2e2",
                                border: "none",
                                color: "#ef4444",
                                fontSize: 10,
                                padding: "4px 6px",
                                borderRadius: 4,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY */}
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

          {/* --- RIGHT PANEL --- */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              overflowY: "auto",
              padding: "20px 20px",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 12,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 4,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <X size={16} />
              </button>
            </div>

            {/* --- MULTI-ASSIGNEE SELECT --- */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Users size={10} /> Assignees
              </div>
              <Select
                mode="multiple"
                value={currentAssigneeIds}
                allowClear
                placeholder="Unassigned"
                onChange={handleAssigneesChange}
                style={{ width: "100%" }}
                size="small"
                maxTagCount={2}
                maxTagPlaceholder={(omitted) => `+${omitted.length} more`}
                optionLabelProp="label"
              >
                {projectAssignees.map((a) => (
                  <Option
                    key={a.profiles?.id}
                    value={a.profiles?.id}
                    label={a.profiles?.full_name}
                  >
                    <Space size={6}>
                      <UserAvatar
                        name={a.profiles?.full_name || "?"}
                        image={a.profiles?.user_photo}
                        size={18}
                      />
                      <span style={{ fontSize: 12 }}>
                        {a.profiles?.full_name}
                      </span>
                    </Space>
                  </Option>
                ))}
              </Select>
              {/* Stacked avatar preview below the select */}
              {currentAssigneeIds.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <MultiAssigneeAvatars
                    assigneeIds={currentAssigneeIds}
                    projectAssignees={projectAssignees}
                    size={26}
                    max={6}
                  />
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 5,
                }}
              >
                Priority
              </div>
              <Select
                value={currentPriority}
                onChange={handlePriorityChange}
                style={{ width: "100%" }}
                size="small"
              >
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: v.dot,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          color: v.color,
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {v.label}
                      </span>
                    </span>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Sprint */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 5,
                }}
              >
                Sprint
              </div>
              <Select
                value={ticket.sprint_id || undefined}
                allowClear
                placeholder="Backlog"
                onChange={async (val) =>
                  await updateField("sprint_id", val, ticket.sprint_id)
                }
                style={{ width: "100%" }}
                size="small"
              >
                {sprints?.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Story Points */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 5,
                }}
              >
                Story Points
              </div>
              <Select
                value={ticket.story_points || 0}
                onChange={async (val) =>
                  await updateField("story_points", val, ticket.story_points)
                }
                style={{ width: "100%" }}
                size="small"
              >
                {[0, 1, 2, 3, 5, 8, 13, 21].map((n) => (
                  <Option key={n} value={n}>
                    {n === 0 ? "Unestimated" : `${n} pt${n !== 1 ? "s" : ""}`}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 5,
                }}
              >
                Due Date
              </div>
              <DatePicker
                defaultValue={ticket.due_date ? dayjs(ticket.due_date) : null}
                style={{ width: "100%" }}
                size="small"
                format="MMM D, YYYY"
                onChange={async (val) =>
                  await updateField(
                    "due_date",
                    val ? val.format("YYYY-MM-DD") : null,
                    ticket.due_date,
                  )
                }
              />
            </div>

            <Divider style={{ margin: "14px 0", borderColor: "#e5e7eb" }} />
            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
              <div>Created {fmtTime(ticket.created_at)}</div>
              {ticket.updated_at && (
                <div>Updated {fmtTime(ticket.updated_at)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ---
// GROUPED KANBAN COLUMN
// FIX 2: Tasks only group under stories PRESENT in this column.
// Prevents the same task appearing both under a story (in sprint A)
// and as an orphan (in sprint B's column).
// ---
const GroupedKanbanColumn = ({
  col,
  tickets, // only tickets belonging to this sprint+column
  allTickets,
  onTicketClick,
  onNewTicket,
  draggingGroup,
  onGroupDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDelete,
  projectAssignees,
  dark = false,
}) => {
  const [isOver, setIsOver] = useState(false);
  const columnHeaderBgByKey = dark
    ? {
        open: "#23262f",
        in_progress: "#1f2a3d",
        completed: "#1d332b",
        closed: "#262933",
      }
    : {};
  const cardBg = dark ? "#181a20" : "#fff";
  const cardBorder = dark ? "#2a2d36" : "#e5e7eb";
  const hoverBg = dark ? "#21242d" : "#f8fafc";
  const textColor = dark ? "#e5e7eb" : "#172b4d";
  const mutedBg = dark ? "#262a33" : "#f1f2f4";
  const mutedText = dark ? "#a9afbd" : "#626f86";

  // Stories visible in this column
  const stories = tickets.filter((t) => t.ticket_type === "story");
  const storyIdsInColumn = new Set(stories.map((s) => s.id));

  // Map tasks/bugs to their parent story, but only if that story is also
  // in this column. Otherwise the task becomes an orphan here.
  const byParent = {};
  tickets
    .filter((t) => t.ticket_type === "task" || t.ticket_type === "bug")
    .forEach((t) => {
      const key =
        t.parent_id && storyIdsInColumn.has(t.parent_id)
          ? t.parent_id
          : "__orphan__";
      if (!byParent[key]) byParent[key] = [];
      byParent[key].push(t);
    });

  // Build story groups (consume children so they don't appear in orphans)
  const groups = [];
  stories.forEach((story) => {
    groups.push({
      type: "story",
      ticket: story,
      children: byParent[story.id] || [],
    });
    // Mark as consumed
    delete byParent[story.id];
  });

  // Remaining orphans (tasks/bugs with no story parent in this column)
  const orphans = byParent["__orphan__"] || [];

  const isDraggingThisGroup = (leadId) => draggingGroup?.leadId === leadId;

  return (
    <div
      style={{ flex: 1, minWidth: 220 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
        onDragOver(col.key);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(col.key);
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 10px",
          borderRadius: 4,
          marginBottom: 8,
          background: dark ? columnHeaderBgByKey[col.key] || "#23262f" : col.headerBg,
          border: `1px solid ${dark ? "#333744" : col.border}`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: col.color,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: col.color,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            flex: 1,
          }}
        >
          {col.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            background: col.color,
            padding: "1px 7px",
            borderRadius: 99,
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {tickets.length}
        </span>
      </div>

      <div
        style={{
          minHeight: 60,
          borderRadius: 4,
          border: isOver
            ? `2px dashed ${col.color}60`
            : "2px dashed transparent",
          background: isOver
            ? dark
              ? "rgba(37, 99, 235, 0.12)"
              : `${col.bg}`
            : undefined,
          transition: "all .15s",
          padding: "0 0 4px",
        }}
      >
        {/* Story groups */}
        {groups.map(({ ticket: story, children }) => {
          const groupDragging = isDraggingThisGroup(story.id);
          const totalMembers = children.length;
          return (
            <div
              key={story.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                onGroupDragStart({
                  leadId: story.id,
                  lead: story,
                  memberIds: children.map((c) => c.id),
                  members: children,
                });
              }}
              onDragEnd={onDragEnd}
              style={{
                marginBottom: 4,
                background: cardBg,
                borderRadius: 6,
                border: groupDragging
                  ? `2px solid ${TICKET_TYPE.story.color}60`
                  : `1px solid ${cardBorder}`,
                overflow: "hidden",
                boxShadow: groupDragging
                  ? `0 8px 24px rgba(5,150,105,0.18)`
                  : dark
                    ? "0 4px 14px rgba(0,0,0,.26)"
                    : "0 1px 2px rgba(0,0,0,.04)",
                opacity: groupDragging ? 0.5 : 1,
                transform: groupDragging ? "scale(0.97)" : "scale(1)",
                transition: "all .15s",
                cursor: "grab",
              }}
            >
              {/* Story header row */}
              <div
                onClick={() => {
                  if (!groupDragging) onTicketClick(story);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderBottom:
                    children.length > 0
                      ? `1px solid ${dark ? "#2f3440" : "#f1f5f9"}`
                      : "none",
                  background: cardBg,
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = cardBg)
                }
              >
                <GripVertical
                  size={11}
                  color="#d1d5db"
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: TICKET_TYPE.story.color,
                    background: TICKET_TYPE.story.bg,
                    padding: "1px 5px",
                    borderRadius: 3,
                    border: `1px solid ${TICKET_TYPE.story.color}30`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  {TICKET_TYPE.story.icon} Story
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    color: textColor,
                    lineHeight: 1.4,
                  }}
                >
                  {story.title}
                </span>
                {totalMembers > 0 && (
                  <Tooltip
                    title={`Drag moves story + ${totalMembers} child ticket${totalMembers > 1 ? "s" : ""}`}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: TICKET_TYPE.story.color,
                        background: TICKET_TYPE.story.bg,
                        padding: "1px 5px",
                        borderRadius: 99,
                        flexShrink: 0,
                      }}
                    >
                      {totalMembers} child{totalMembers > 1 ? "ren" : ""}
                    </span>
                  </Tooltip>
                )}
                <MultiAssigneeAvatars
                  assigneeIds={getAssigneeIds(story)}
                  projectAssignees={projectAssignees || []}
                  size={18}
                  max={2}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story, children);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    color: "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.4,
                    transition: "opacity .15s, color .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = 0.4;
                    e.currentTarget.style.color = "#d1d5db";
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Children */}
              {children.map((child) => {
                const tt = TICKET_TYPE[child.ticket_type] || TICKET_TYPE.task;
                const p = PRIORITY[child.priority] || PRIORITY.medium;
                return (
                  <div
                    key={child.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTicketClick(child);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px 7px 22px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${dark ? "#272c37" : "#f8fafc"}`,
                      background: cardBg,
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = cardBg)
                    }
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: tt.color,
                        background: tt.bg,
                        padding: "1px 4px",
                        borderRadius: 3,
                        border: `1px solid ${tt.color}30`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      {tt.icon}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: textColor,
                        lineHeight: 1.4,
                      }}
                    >
                      {child.title}
                    </span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: p.dot,
                        flexShrink: 0,
                      }}
                    />
                    {child.story_points > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: mutedText,
                          background: mutedBg,
                          padding: "1px 5px",
                          borderRadius: 99,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {child.story_points}
                      </span>
                    )}
                    <MultiAssigneeAvatars
                      assigneeIds={getAssigneeIds(child)}
                      projectAssignees={projectAssignees || []}
                      size={18}
                      max={2}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(child);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        color: "#d1d5db",
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.4,
                        transition: "opacity .15s, color .15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = 1;
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = 0.4;
                        e.currentTarget.style.color = "#d1d5db";
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Orphan tasks/bugs (no story parent in this column) */}
        {orphans.map((t) => {
          const tt = TICKET_TYPE[t.ticket_type] || TICKET_TYPE.task;
          const p = PRIORITY[t.priority] || PRIORITY.medium;
          const isOrphanDragging =
            draggingGroup?.leadId === t.id && !draggingGroup?.members?.length;
          return (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                onGroupDragStart({
                  leadId: t.id,
                  lead: t,
                  memberIds: [],
                  members: [],
                });
              }}
              onDragEnd={onDragEnd}
              style={{
                marginBottom: 4,
                background: cardBg,
                borderRadius: 6,
                border: `1px solid ${cardBorder}`,
                overflow: "hidden",
                boxShadow: isOrphanDragging
                  ? "0 8px 24px rgba(0,0,0,.12)"
                  : dark
                    ? "0 4px 14px rgba(0,0,0,.24)"
                    : "0 1px 2px rgba(0,0,0,.04)",
                opacity: isOrphanDragging ? 0.5 : 1,
                transition: "all .15s",
                cursor: "grab",
              }}
            >
              <div
                onClick={() => onTicketClick(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = cardBg)
                }
              >
                <GripVertical
                  size={11}
                  color="#d1d5db"
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: tt.color,
                    background: tt.bg,
                    padding: "1px 5px",
                    borderRadius: 3,
                    border: `1px solid ${tt.color}30`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  {tt.icon} {tt.label}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: textColor,
                    lineHeight: 1.4,
                  }}
                >
                  {t.title}
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: p.dot,
                    flexShrink: 0,
                  }}
                />
                {t.story_points > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: mutedText,
                      background: mutedBg,
                      padding: "1px 5px",
                      borderRadius: 99,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {t.story_points}
                  </span>
                )}
                <MultiAssigneeAvatars
                  assigneeIds={getAssigneeIds(t)}
                  projectAssignees={projectAssignees || []}
                  size={18}
                  max={2}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    color: "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.4,
                    transition: "opacity .15s, color .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = 1;
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = 0.4;
                    e.currentTarget.style.color = "#d1d5db";
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}

        {isOver && draggingGroup && (
          <div
            style={{
              height: 44,
              borderRadius: 6,
              border: `2px dashed ${col.color}60`,
              background: dark ? "rgba(37, 99, 235, 0.14)" : `${col.bg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 11, color: col.color, fontWeight: 600 }}>
              {draggingGroup.members?.length > 0
                ? `Drop story + ${draggingGroup.members.length} child${draggingGroup.members.length > 1 ? "ren" : ""} here`
                : "Drop here"}
            </span>
          </div>
        )}

        <button
          onClick={() => onNewTicket(col.key)}
          style={{
            width: "100%",
            padding: "6px",
            borderRadius: 4,
            border: `1.5px dashed ${dark ? "#3a3f4d" : "#dde3ec"}`,
            background: "transparent",
            cursor: "pointer",
            color: dark ? "#aab1bf" : "#626f86",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0c66e4";
            e.currentTarget.style.color = "#0c66e4";
            e.currentTarget.style.background = dark ? "#1d2f4f" : "#e9f2ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = dark ? "#3a3f4d" : "#dde3ec";
            e.currentTarget.style.color = dark ? "#aab1bf" : "#626f86";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Plus size={11} /> Create issue
        </button>
      </div>
    </div>
  );
};

// ---
// SPRINT BOARD
// ---
const SprintBoard = ({
  sprint,
  tickets,
  allTickets,
  onTicketClick,
  onNewTicket,
  onEditSprint,
  onGroupDragStart,
  onDragEnd,
  draggingGroup,
  onDragOver,
  onDrop,
  onDelete,
  projectAssignees,
  dark = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  // Only show ticket types that belong on the board (no epics, no subtasks)
  const boardable = tickets.filter(
    (t) => HIERARCHY[t.ticket_type]?.showOnBoard !== false,
  );
  const prog = sprintProgress(boardable);
  const isActive = sprint.status === "active";

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: isActive
            ? dark
              ? "linear-gradient(90deg,#1c2740,#1f3b33)"
              : "linear-gradient(90deg,#e9f2ff,#dcfff1)"
            : dark
              ? "#1c1f27"
              : "#f8fafc",
          border: `1.5px solid ${isActive ? (dark ? "#30496b" : "#b8d0f5") : dark ? "#2b2f39" : "#e2e8f0"}`,
          borderRadius: 8,
          marginBottom: 10,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        {isActive && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 3,
              background: "linear-gradient(180deg,#0c66e4,#22a06b)",
            }}
          />
        )}
        <Zap size={14} color={isActive ? "#0c66e4" : "#9ca3af"} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: dark ? "#f3f4f6" : "#172b4d" }}>
              {sprint.name}
            </span>
            {isActive && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#fff",
                  background: "#0c66e4",
                  padding: "1px 6px",
                  borderRadius: 99,
                }}
              >
                ACTIVE
              </span>
            )}
            {sprint.status === "completed" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#fff",
                  background: "#22a06b",
                  padding: "1px 6px",
                  borderRadius: 99,
                }}
              >
                DONE
              </span>
            )}
            {sprint.status === "planning" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: dark ? "#c2c8d3" : "#626f86",
                  background: dark ? "#2a2e38" : "#f1f2f4",
                  padding: "1px 6px",
                  borderRadius: 99,
                  border: `1px solid ${dark ? "#3a3f4b" : "#e2e4e9"}`,
                }}
              >
                PLANNING
              </span>
            )}
          </div>
          {sprint.goal && (
            <p style={{ fontSize: 11, color: dark ? "#a9afbd" : "#626f86", margin: "1px 0 0" }}>
              {sprint.goal}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: dark ? "#a9afbd" : "#626f86" }}>
            {fmtDate(sprint.start_date)} - {fmtDate(sprint.end_date)}
          </span>
          <Progress
            type="circle"
            percent={prog}
            size={32}
            strokeWidth={8}
            strokeColor={prog === 100 ? "#22a06b" : "#0c66e4"}
            format={(p) => (
              <span style={{ fontSize: 8, fontWeight: 700 }}>{p}%</span>
            )}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditSprint(sprint);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              borderRadius: 4,
              color: dark ? "#a9afbd" : "#626f86",
            }}
          >
            <MoreHorizontal size={15} />
          </button>
          {collapsed ? (
            <ChevronDown size={14} color="#9ca3af" />
          ) : (
            <ChevronUp size={14} color="#9ca3af" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {TICKET_STATUS.map((col) => (
            <GroupedKanbanColumn
              key={col.key}
              col={col}
              tickets={boardable.filter((t) => t.status === col.key)}
              allTickets={allTickets}
              onTicketClick={onTicketClick}
              draggingGroup={draggingGroup}
              onGroupDragStart={onGroupDragStart}
              onDragEnd={onDragEnd}
              onDragOver={() => onDragOver(col.key)}
              onDrop={() => onDrop(sprint.id, col.key)}
              onNewTicket={(status) => onNewTicket(sprint, status)}
              onDelete={onDelete}
              projectAssignees={projectAssignees}
              dark={dark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---
// BACKLOG COMPONENTS
// ---
const BacklogEpicRow = ({
  epic,
  allTickets,
  onEdit,
  onTicketClick,
  onNewChild,
  onDragStart,
  onDragEnd,
  isDragging,
  onDelete,
  projectAssignees,
  dark = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const children = allTickets.filter((t) => t.parent_id === epic.id);
  const childDone = children.filter(
    (t) => t.status === "completed" || t.status === "closed",
  ).length;
  return (
    <div style={{ borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f5f9"}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: expanded
            ? dark
              ? "#241f33"
              : "#f8f5ff"
            : "transparent",
          cursor: "pointer",
          transition: "background .1s",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? (
          <ChevronDown size={12} color="#7c3aed" />
        ) : (
          <ChevronRight size={12} color="#9ca3af" />
        )}
        <TypeChip type="epic" />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 700,
            color: dark ? "#f3f4f6" : "#172b4d",
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onTicketClick(epic);
          }}
        >
          {epic.title}
        </span>
        <PriorityIcon priority={epic.priority} />
        <span
          style={{
            fontSize: 11,
            color: dark ? "#a9afbd" : "#626f86",
            background: dark ? "#2a2f39" : "#f1f2f4",
            padding: "2px 8px",
            borderRadius: 99,
          }}
        >
          {childDone}/{children.length}
        </span>
        <MultiAssigneeAvatars
          assigneeIds={getAssigneeIds(epic)}
          projectAssignees={projectAssignees || []}
          size={20}
          max={3}
        />
        <Tooltip title="Add Story/Task/Bug under this Epic">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNewChild(epic);
            }}
            style={{
              background: dark ? "#2b2540" : "#f0f0ff",
              border: `1px solid ${dark ? "#4a3f72" : "#c7d2fe"}`,
              color: dark ? "#c4b5fd" : "#6366f1",
              borderRadius: 4,
              cursor: "pointer",
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Plus size={10} /> Add
          </button>
        </Tooltip>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(epic);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 3,
            color: "#d1d5db",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Edit2 size={12} />
        </button>
        <Tooltip title="Delete Epic">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(epic, children);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 3,
              color: "#d1d5db",
              display: "flex",
              alignItems: "center",
              opacity: 0.4,
              transition: "opacity .15s, color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.4;
              e.currentTarget.style.color = "#d1d5db";
            }}
          >
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 28 }}>
          {children.length === 0 && (
            <div
              style={{
                padding: "8px 14px",
                fontSize: 12,
                color: dark ? "#9ca3af" : "#d1d5db",
                fontStyle: "italic",
              }}
            >
              No tickets yet
            </div>
          )}
          {children.map((child) => (
            <BacklogChildRow
              key={child.id}
              ticket={child}
              allTickets={allTickets}
              onEdit={onEdit}
              onTicketClick={onTicketClick}
              onNewChild={onNewChild}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isDragging === child.id}
              onDelete={onDelete}
              projectAssignees={projectAssignees}
              dark={dark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BacklogChildRow = ({
  ticket,
  allTickets,
  onEdit,
  onTicketClick,
  onNewChild,
  onDragStart,
  onDragEnd,
  isDragging,
  onDelete,
  projectAssignees,
  dark = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const subtasks =
    ticket.ticket_type !== "subtask"
      ? allTickets.filter(
          (t) => t.parent_id === ticket.id && t.ticket_type === "subtask",
        )
      : [];
  const isSubtask = ticket.ticket_type === "subtask";
  const tt = TICKET_TYPE[ticket.ticket_type] || TICKET_TYPE.task;
  const p = PRIORITY[ticket.priority] || PRIORITY.medium;

  return (
    <div style={{ borderBottom: `1px solid ${dark ? "#242833" : "#f8fafc"}` }}>
      <div
        draggable={!isSubtask}
        onDragStart={(e) => {
          if (!isSubtask) {
            e.dataTransfer.effectAllowed = "move";
            onDragStart(ticket);
          }
        }}
        onDragEnd={onDragEnd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: isSubtask ? "7px 14px 7px 28px" : "9px 14px",
          borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f5f9"}`,
          transition: "background .1s, opacity .15s",
          cursor: isSubtask ? "default" : "pointer",
          opacity: isDragging ? 0.4 : 1,
          background: isDragging
            ? dark
              ? "#2b2540"
              : "#f0f0ff"
            : "transparent",
        }}
        onMouseEnter={(e) =>
          !isDragging &&
          (e.currentTarget.style.background = dark ? "#1d2027" : "#f8fafc")
        }
        onMouseLeave={(e) =>
          !isDragging && (e.currentTarget.style.background = "transparent")
        }
      >
        {!isSubtask && (
          <GripVertical size={12} color="#d1d5db" style={{ flexShrink: 0 }} />
        )}
        {isSubtask && (
          <ChevronsRight size={12} color="#d1d5db" style={{ flexShrink: 0 }} />
        )}

        {subtasks.length > 0 ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {expanded ? (
              <ChevronDown size={10} color="#9ca3af" />
            ) : (
              <ChevronRight size={10} color="#9ca3af" />
            )}
          </button>
        ) : (
          <div style={{ width: 10 }} />
        )}

        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: tt.color,
            background: tt.bg,
            padding: "1px 5px",
            borderRadius: 3,
            border: `1px solid ${tt.color}30`,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
          }}
        >
          {tt.icon} <span style={{ fontSize: 9 }}>{tt.label}</span>
        </span>

        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            color: dark ? "#f3f4f6" : "#172b4d",
            cursor: "pointer",
          }}
          onClick={() => onTicketClick(ticket)}
        >
          {ticket.title}
        </span>

        <PriorityIcon priority={ticket.priority} />
        <StatusBadge status={ticket.status} dark={dark} />

        {ticket.story_points > 0 && (
          <span
            style={{
              fontSize: 11,
              color: dark ? "#a9afbd" : "#626f86",
              background: dark ? "#2a2f39" : "#f1f2f4",
              padding: "2px 6px",
              borderRadius: 99,
              fontWeight: 600,
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {ticket.story_points}
          </span>
        )}

        <MultiAssigneeAvatars
          assigneeIds={getAssigneeIds(ticket)}
          projectAssignees={projectAssignees || []}
          size={20}
          max={3}
        />

        {!isSubtask && (
          <Tooltip title="Add Subtask">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewChild(ticket, "subtask");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 3,
                color: "#d1d5db",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Plus size={10} />
            </button>
          </Tooltip>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(ticket);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 3,
            color: "#d1d5db",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Edit2 size={12} />
        </button>
        <Tooltip title="Delete">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ticket);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 3,
              color: "#d1d5db",
              display: "flex",
              alignItems: "center",
              opacity: 0.4,
              transition: "opacity .15s, color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.4;
              e.currentTarget.style.color = "#d1d5db";
            }}
          >
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
      {expanded &&
        subtasks.map((st) => (
          <BacklogChildRow
            key={st.id}
            ticket={st}
            allTickets={allTickets}
            onEdit={onEdit}
            onTicketClick={onTicketClick}
            onNewChild={onNewChild}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={false}
            onDelete={onDelete}
            projectAssignees={projectAssignees}
            dark={dark}
          />
        ))}
    </div>
  );
};

// ---
// PROJECT CARD
// ---
const ProjectCard = ({ project, onClick, dark = false }) => {
  const ps =
    PROJECT_STATUS.find((s) => s.key === project.status) || PROJECT_STATUS[0];
  const darkStatusTag = {
    not_started: { color: "#cbd5e1", bg: "#273141", border: "#3c4b61" },
    in_progress: { color: "#93c5fd", bg: "#1e3a66", border: "#2d5189" },
    testing: { color: "#fcd34d", bg: "#46361e", border: "#6b532d" },
    completed: { color: "#86efac", bg: "#1f3a2f", border: "#2f5a46" },
  }[ps.key] || { color: "#d1d5db", bg: "#2a2f3a", border: "#3d4452" };
  return (
    <div
      className={`pm-project-card${dark ? " dark" : ""}`}
      onClick={onClick}
      style={{
        background: dark ? "#1a1b1f" : "#fff",
        borderRadius: 8,
        border: dark ? "1px solid #2a2b31" : "1px solid #e5e7eb",
        padding: "12px 14px",
        marginBottom: 8,
        cursor: "pointer",
        boxShadow: dark
          ? "0 2px 10px rgba(0,0,0,.35)"
          : "0 1px 2px rgba(0,0,0,.04)",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = dark
          ? "0 8px 24px rgba(0,0,0,.42)"
          : "0 4px 16px rgba(0,0,0,.08)";
        e.currentTarget.style.borderColor = ps.border;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = dark
          ? "0 2px 10px rgba(0,0,0,.35)"
          : "0 1px 2px rgba(0,0,0,.04)";
        e.currentTarget.style.borderColor = dark ? "#2a2b31" : "#e5e7eb";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: ps.color,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 5,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: dark ? "#f3f4f6" : "#172b4d",
            margin: 0,
          }}
        >
          {project.name}
        </h3>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 99,
            color: dark ? darkStatusTag.color : ps.color,
            background: dark ? darkStatusTag.bg : ps.bg,
            border: `1px solid ${dark ? darkStatusTag.border : ps.border}`,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
            marginLeft: 6,
          }}
        >
          {ps.label}
        </span>
      </div>
      <p
        style={{
            fontSize: 11,
            color: dark ? "#9ca3af" : "#626f86",
            margin: "0 0 8px",
            lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {project.description || "No description"}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: -4 }}>
          {project.project_assignees?.slice(0, 4).map((a, i) => (
            <div key={i} style={{ marginLeft: i > 0 ? -5 : 0 }}>
              <UserAvatar
                name={a.profiles?.full_name || "?"}
                image={a?.profiles?.user_photo}
                size={20}
              />
            </div>
          ))}
        </div>
        <span
          style={{
            fontSize: 10,
            color: dark ? "#9ca3af" : "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Calendar size={9} />
          {fmtDate(project.end_date)}
        </span>
      </div>
    </div>
  );
};

// ---
// AI SUGGESTION WIDGET
// ---
const AISuggestionBanner = ({ suggestion, onApply, onDismiss, dark = false }) => (
  <div
    style={{
      background: dark
        ? "linear-gradient(135deg,#1f2340,#2a1f3d)"
        : "linear-gradient(135deg,#f0f0ff,#fdf4ff)",
      border: `1px solid ${dark ? "#3e3f6d" : "#c7d2fe"}`,
      borderRadius: 10,
      padding: "11px 12px",
      marginBottom: 14,
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      boxShadow: dark ? "0 8px 18px rgba(0,0,0,.28)" : "none",
    }}
  >
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Sparkles size={13} color="#fff" />
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{
        fontSize: 11,
        fontWeight: 700,
        color: dark ? "#c4b5fd" : "#4338ca",
        marginBottom: 3,
      }}
    >
        AI Suggestion
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: dark ? "#d1d5db" : "#374151" }}>
          Priority:{" "}
          <strong style={{ color: PRIORITY[suggestion.priority]?.color }}>
            {suggestion.priority}
          </strong>
        </span>
        <span style={{ fontSize: 12, color: dark ? "#d1d5db" : "#374151" }}>
          Points:{" "}
          <strong style={{ color: dark ? "#a5b4fc" : "#6366f1" }}>
            {suggestion.story_points}pt
          </strong>
        </span>
        {suggestion.reasoning && (
          <span
            style={{
              fontSize: 11,
              color: dark ? "#a5adbb" : "#6b7280",
              fontStyle: "italic",
            }}
          >
            "{suggestion.reasoning}"
          </span>
        )}
      </div>
    </div>
    <div style={{ display: "flex", gap: 5 }}>
      <button
        onClick={onApply}
        style={{
          background: dark
            ? "linear-gradient(135deg,#6366f1,#4f46e5)"
            : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: dark ? "1px solid #7176ff" : "none",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          padding: "5px 11px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Apply
      </button>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 3,
          color: dark ? "#a7adba" : "#9ca3af",
        }}
      >
        <X size={13} />
      </button>
    </div>
  </div>
);

// ---
// QUICK ADD
// ---
const QuickAddRow = ({
  onAdd,
  onCancel,
  allowedTypes = ["task", "story", "bug"],
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(allowedTypes[0] || "task");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const submit = () => {
    if (title.trim()) onAdd({ title: title.trim(), type });
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px",
        background: "#f8fafc",
        borderBottom: "1px solid #e5e7eb",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <Select
        value={type}
        onChange={setType}
        size="small"
        style={{ width: 90 }}
      >
        {allowedTypes.map((k) => (
          <Option key={k} value={k}>
            <span style={{ fontSize: 11 }}>{TICKET_TYPE[k]?.label}</span>
          </Option>
        ))}
      </Select>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="What needs to be done? (Enter to save)"
        style={{
          flex: 1,
          border: "1px solid #b8d0f5",
          borderRadius: 4,
          padding: "5px 9px",
          fontSize: 12,
          outline: "none",
          background: "#fff",
          color: "#172b4d",
        }}
      />
      <button
        onClick={submit}
        style={{
          background: "#0c66e4",
          border: "none",
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          padding: "5px 11px",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Save
      </button>
      <button
        onClick={onCancel}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          padding: 3,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
};

// ---
// MAIN COMPONENT
// ---
const PMProjects = ({
  embedded = false,
  initialProjectId = null,
  onCloseEmbeddedBoard,
}) => {
  const { projectId: routeProjectId } = useParams();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editingSprint, setEditingSprint] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("open");
  const [defaultSprintId, setDefaultSprintId] = useState(null);
  const [activeTab, setActiveTab] = useState("board");
  const [searchQ, setSearchQ] = useState("");
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);
  const [defaultTicketType, setDefaultTicketType] = useState("task");
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [aiPlannerLoading, setAiPlannerLoading] = useState(false);
  const [aiPlannerApplying, setAiPlannerApplying] = useState(false);
  const [aiProjectBrief, setAiProjectBrief] = useState("");
  const [aiPlannerFile, setAiPlannerFile] = useState(null);
  const [aiPlannerResult, setAiPlannerResult] = useState(null);
  const [clientProgressInvite, setClientProgressInvite] = useState(null);

  const [ticketForm] = Form.useForm();
  const [sprintForm] = Form.useForm();

  useEffect(() => {
    getProfile();
  }, []);
  useEffect(() => {
    if (profile?.id) fetchProjects();
  }, [profile]);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
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

  const getAllowedParentTypes = (type) => HIERARCHY[type]?.parentTypes || [];
  const getParentOptions = (type) =>
    tickets.filter((t) => getAllowedParentTypes(type).includes(t.ticket_type));

  const getProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("projects")
        .select(
          `*, project_assignees(employee_id, profiles:employee_id(id,full_name,email,user_photo))`,
        )
        .order("created_at", { ascending: false });

      if (profile?.tenant_id) {
        query = query.eq("tenant_id", profile.tenant_id);
      }

      if (profile?.role !== "admin") {
        query = query.eq("project_manager_id", profile?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch {
      message.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  // FIX 3: explicitly select assigned_to_ids in the query
  const fetchProjectData = async (projectId) => {
    setLoadingData(true);
    try {
      const [{ data: ticketData }, { data: sprintData }] = await Promise.all([
        supabase
          .from("tickets")
          .select(
            `*, assigned_to_ids, profiles:assigned_to(full_name,email,user_photo)`,
          )
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("sprints")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
      ]);
      setTickets(ticketData || []);
      setSprints(sprintData || []);
    } catch {
      message.error("Failed to fetch project data");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchClientProgressInvite = async (projectId) => {
    if (!projectId) {
      setClientProgressInvite(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("project_client_invites")
        .select("id, share_token, client_email, last_sent_at")
        .eq("project_id", projectId)
        .order("last_sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setClientProgressInvite(data || null);
    } catch (err) {
      console.error("Failed to fetch client progress invite:", err);
      setClientProgressInvite(null);
    }
  };

  const syncClientProgressSnapshot = useCallback(
    async (projectId, nextTickets = tickets, nextSprints = sprints) => {
      if (!projectId) return;
      try {
        const scopedProject = projects.find((p) => p.id === projectId);
        const safeTickets = Array.isArray(nextTickets) ? nextTickets : [];
        const safeSprints = Array.isArray(nextSprints) ? nextSprints : [];
        const doneCount = safeTickets.filter(
          (t) => t.status === "completed" || t.status === "closed",
        ).length;

        const snapshot = {
          generated_at: new Date().toISOString(),
          project: {
            id: scopedProject?.id || projectId,
            name: scopedProject?.name || "Project",
            status: scopedProject?.status || "in_progress",
            client_name: scopedProject?.client_name || null,
            start_date: scopedProject?.start_date || null,
            end_date: scopedProject?.end_date || null,
          },
          tickets: safeTickets.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            ticket_type: t.ticket_type,
            sprint_id: t.sprint_id || null,
          })),
          sprints: safeSprints.map((s) => ({
            id: s.id,
            name: s.name,
            status: s.status,
            start_date: s.start_date || null,
            end_date: s.end_date || null,
          })),
          summary: {
            total_tickets: safeTickets.length,
            completed_tickets: doneCount,
            progress_percent: safeTickets.length
              ? Math.round((doneCount / safeTickets.length) * 100)
              : 0,
          },
        };

        await supabase
          .from("project_client_invites")
          .update({ snapshot, updated_at: new Date().toISOString() })
          .eq("project_id", projectId);
      } catch (err) {
        console.error("Client snapshot sync skipped:", err);
      }
    },
    [projects, tickets, sprints],
  );

  const openProject = (project) => {
    setSelectedProject(project);
    fetchProjectData(project.id);
    fetchClientProgressInvite(project.id);
    setShowProjectDrawer(true);
  };

  useEffect(() => {
    const targetProjectId = initialProjectId || routeProjectId;
    if (
      !targetProjectId ||
      !projects.length ||
      String(selectedProject?.id) === String(targetProjectId)
    ) {
      return;
    }
    const matchedProject = projects.find(
      (project) => String(project.id) === String(targetProjectId),
    );
    if (!matchedProject) return;
    setSelectedProject(matchedProject);
    fetchProjectData(matchedProject.id);
    fetchClientProgressInvite(matchedProject.id);
    setShowProjectDrawer(true);
  }, [initialProjectId, routeProjectId, projects, selectedProject?.id]);

  useEffect(() => {
    if (!selectedProject?.id || loadingData) return;
    const timer = setTimeout(() => {
      syncClientProgressSnapshot(selectedProject.id, tickets, sprints);
    }, 700);
    return () => clearTimeout(timer);
  }, [
    selectedProject?.id,
    loadingData,
    tickets,
    sprints,
    syncClientProgressSnapshot,
  ]);

  const closeProjectDrawer = () => {
    setShowProjectDrawer(false);
    setSelectedProject(null);
    setTickets([]);
    setSprints([]);
    ticketForm.resetFields();
    setEditingTicket(null);
    setAiSuggestion(null);
    setShowAiPlanner(false);
    setAiPlannerResult(null);
    setAiProjectBrief("");
    setAiPlannerFile(null);
    setClientProgressInvite(null);
    if (embedded && typeof onCloseEmbeddedBoard === "function") {
      onCloseEmbeddedBoard();
    }
  };

  // --- GROUP DRAG HANDLERS ---
  const handleGroupDragStart = useCallback((group) => {
    setDraggingGroup(group);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingGroup(null);
    setHoveredColumn(null);
  }, []);

  const handleDragOver = useCallback((columnKey) => {
    setHoveredColumn(columnKey);
  }, []);

  const handleDrop = useCallback(
    async (sprintId, newStatus) => {
      if (!draggingGroup) return;
      const { lead, members } = draggingGroup;
      const allToUpdate = [lead, ...members];

      const anyChanged = allToUpdate.some(
        (t) => t.status !== newStatus || t.sprint_id !== sprintId,
      );
      if (!anyChanged) {
        setDraggingGroup(null);
        return;
      }

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) => {
          const match = allToUpdate.find((u) => u.id === t.id);
          if (match) return { ...t, status: newStatus, sprint_id: sprintId };
          return t;
        }),
      );

      try {
        const updatePromises = allToUpdate.map((t) =>
          supabase
            .from("tickets")
            .update({ status: newStatus, sprint_id: sprintId })
            .eq("id", t.id),
        );
        const results = await Promise.all(updatePromises);
        const anyError = results.find((r) => r.error);
        if (anyError) throw anyError.error;

        const label = TICKET_STATUS.find((s) => s.key === newStatus)?.label;
        if (members.length > 0) {
          message.success(
            `Moved story + ${members.length} child ticket${members.length > 1 ? "s" : ""} to ${label}`,
          );
        } else {
          message.success(`Moved to ${label}`);
        }
      } catch {
        message.error("Failed to move ticket(s)");
        setTickets((prev) =>
          prev.map((t) => {
            const original = allToUpdate.find((u) => u.id === t.id);
            if (original)
              return {
                ...t,
                status: original.status,
                sprint_id: original.sprint_id,
              };
            return t;
          }),
        );
      }

      setDraggingGroup(null);
      setHoveredColumn(null);
    },
    [draggingGroup],
  );

  const runAIAnalysis = async () => {
    const title = ticketForm.getFieldValue("title");
    const description = ticketForm.getFieldValue("description");
    const type = ticketForm.getFieldValue("ticket_type") || "task";
    if (!title?.trim()) {
      message.warning("Enter a title first");
      return;
    }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const result = await analyzeTicketWithAI(title, description, type);
      if (result) setAiSuggestion(result);
      else message.error("AI analysis failed");
    } catch {
      message.error("AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    ticketForm.setFieldsValue({
      priority: aiSuggestion.priority,
      story_points: aiSuggestion.story_points,
    });
    setAiSuggestion(null);
    message.success("AI suggestions applied!");
  };

  const runAiPlanner = async () => {
    if (!selectedProject?.id) return;
    if (!GROQ_API_KEY) {
      message.error("Missing AI key. Set VITE_GROK_API_KEY in environment.");
      return;
    }
    if (!aiProjectBrief.trim() && !aiPlannerFile) {
      message.warning("Add project brief or upload a file first.");
      return;
    }

    setAiPlannerLoading(true);
    try {
      const fileText = aiPlannerFile ? await readPlannerFileText(aiPlannerFile) : "";
      const plan = await generateProjectPlanWithAI({
        projectName: selectedProject.name || "Project",
        brief: aiProjectBrief.trim(),
        extraText: fileText,
      });
      if (!plan.tickets.length) {
        message.warning("AI returned no tickets. Please add more details and try again.");
        setAiPlannerResult(null);
        return;
      }
      setAiPlannerResult(plan);
      message.success("AI plan generated. Review and apply.");
    } catch (err) {
      message.error(err?.message || "Failed to generate AI plan");
    } finally {
      setAiPlannerLoading(false);
    }
  };

  const applyAiPlannerResult = async () => {
    if (!aiPlannerResult || !selectedProject?.id || !profile?.id) return;
    setAiPlannerApplying(true);
    try {
      const sprintNameToId = {};
      for (const sp of aiPlannerResult.sprints) {
        const { data, error } = await supabase
          .from("sprints")
          .insert([
            {
              project_id: selectedProject.id,
              name: sp.name,
              goal: sp.goal,
              status: sp.status,
              start_date: sp.start_date || null,
              end_date: sp.end_date || null,
              created_by: profile.id,
            },
          ])
          .select("id,name")
          .single();
        if (error) throw error;
        sprintNameToId[data.name] = data.id;
      }

      const typeOrder = { epic: 0, story: 1, task: 2, bug: 2, subtask: 3 };
      const sortedTickets = [...aiPlannerResult.tickets].sort(
        (a, b) => (typeOrder[a.ticket_type] ?? 9) - (typeOrder[b.ticket_type] ?? 9),
      );

      const keyToId = {};
      for (const tk of sortedTickets) {
        const payload = {
          project_id: selectedProject.id,
          title: tk.title,
          description: tk.description || "",
          status: tk.status || "open",
          priority: tk.priority || "medium",
          ticket_type: tk.ticket_type || "task",
          story_points: tk.story_points || 0,
          sprint_id: tk.sprint_name ? sprintNameToId[tk.sprint_name] || null : null,
          parent_id: tk.parent_key ? keyToId[tk.parent_key] || null : null,
          assigned_to: null,
          assigned_to_ids: [],
          created_by: profile.id,
        };
        if (payload.ticket_type === "epic") payload.sprint_id = null;
        const { data, error } = await supabase
          .from("tickets")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        keyToId[tk.key] = data.id;
      }

      await fetchProjectData(selectedProject.id);
      message.success(
        `Created ${aiPlannerResult.sprints.length} sprint(s) and ${aiPlannerResult.tickets.length} ticket(s).`,
      );
      setShowAiPlanner(false);
      setAiPlannerResult(null);
      setAiProjectBrief("");
      setAiPlannerFile(null);
    } catch (err) {
      message.error("Failed to apply AI plan: " + (err?.message || "Unknown error"));
    } finally {
      setAiPlannerApplying(false);
    }
  };

  const openTicketForm = (
    ticket = null,
    sprintId = null,
    status = "open",
    parentTicket = null,
    forcedType = null,
  ) => {
    setDefaultSprintId(sprintId);
    setDefaultStatus(status);
    setAiSuggestion(null);
    setDefaultParentId(parentTicket?.id || null);
    setDefaultTicketType(forcedType || ticket?.ticket_type || "task");
    if (ticket) {
      setEditingTicket(ticket);
      ticketForm.setFieldsValue({
        title: ticket.title,
        description: ticket.description || "",
        priority: ticket.priority,
        status: ticket.status,
        ticket_type: ticket.ticket_type || "task",
        story_points: ticket.story_points || 0,
        assigned_to_ids: getAssigneeIds(ticket),
        due_date: ticket.due_date ? dayjs(ticket.due_date) : undefined,
        sprint_id: ticket.sprint_id || undefined,
        parent_id: ticket.parent_id || undefined,
      });
    } else {
      ticketForm.resetFields();
      ticketForm.setFieldsValue({
        status,
        priority: "medium",
        ticket_type: forcedType || "task",
        story_points: 0,
        sprint_id: sprintId || undefined,
        parent_id: parentTicket?.id || undefined,
        assigned_to_ids: [],
      });
      setEditingTicket(null);
    }
    setShowTicketForm(true);
  };

  const handleNewChildFromBacklog = (parentTicket, forcedType = null) => {
    const childType =
      forcedType || (parentTicket.ticket_type === "epic" ? "story" : "subtask");
    openTicketForm(null, null, "open", parentTicket, childType);
  };

  // FIX 4: save assigned_to_ids correctly as proper array
  const handleSaveTicket = async (values) => {
    try {
      const assigneeIds = Array.isArray(values.assigned_to_ids)
        ? values.assigned_to_ids
        : [];
      const payload = {
        project_id: selectedProject?.id,
        title: values.title,
        description: values.description || "",
        status: values.status,
        priority: values.priority,
        ticket_type: values.ticket_type || "task",
        story_points: values.story_points || 0,
        assigned_to: assigneeIds[0] || null,
        assigned_to_ids: assigneeIds,
        sprint_id: values.sprint_id || null,
        due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
        parent_id: values.parent_id || null,
      };
      if (payload.ticket_type === "epic") payload.sprint_id = null;
      if (editingTicket) {
        const { error } = await supabase
          .from("tickets")
          .update(payload)
          .eq("id", editingTicket.id);
        if (error) throw error;
        message.success("Ticket updated");
      } else {
        const { error } = await supabase
          .from("tickets")
          .insert([{ ...payload, created_by: profile?.id }]);
        if (error) throw error;
        message.success("Ticket created");
      }
      await fetchProjectData(selectedProject.id);
      setShowTicketForm(false);
      ticketForm.resetFields();
      setEditingTicket(null);
      setAiSuggestion(null);
    } catch (err) {
      message.error("Failed: " + err.message);
    }
  };

  const handleQuickAdd = async ({ title, type }) => {
    try {
      const { error } = await supabase.from("tickets").insert([
        {
          project_id: selectedProject?.id,
          title,
          ticket_type: type,
          status: "open",
          priority: "medium",
          story_points: 0,
          sprint_id: null,
          parent_id: null,
          assigned_to: null,
          assigned_to_ids: [],
          created_by: profile?.id,
        },
      ]);
      if (error) throw error;
      message.success("Added to backlog");
      setShowQuickAdd(false);
      await fetchProjectData(selectedProject.id);
    } catch (err) {
      message.error("Failed: " + err.message);
    }
  };

  const handleDeleteTicket = async (ticket, knownChildren = []) => {
    const hasChildren =
      knownChildren.length > 0 ||
      tickets.some((t) => t.parent_id === ticket.id);
    const confirmMsg = hasChildren
      ? `Delete "${ticket.title}" and all its child tickets?`
      : `Delete "${ticket.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const findAllChildren = (parentId) => {
        const children = tickets.filter((t) => t.parent_id === parentId);
        let all = [...children];
        children.forEach((c) => {
          all = [...all, ...findAllChildren(c.id)];
        });
        return all;
      };

      const childrenToDelete = findAllChildren(ticket.id);
      const allIds = [ticket.id, ...childrenToDelete.map((c) => c.id)];

      await Promise.all([
        supabase.from("ticket_comments").delete().in("ticket_id", allIds),
        supabase.from("ticket_attachments").delete().in("ticket_id", allIds),
      ]);

      const { error } = await supabase
        .from("tickets")
        .delete()
        .in("id", allIds);
      if (error) throw error;

      message.success("Deleted successfully");
      await fetchProjectData(selectedProject.id);
      if (detailTicket?.id === ticket.id) setDetailTicket(null);
    } catch (err) {
      message.error("Failed to delete: " + err.message);
    }
  };

  const openSprintForm = (sprint = null) => {
    setEditingSprint(sprint);
    if (sprint) {
      sprintForm.setFieldsValue({
        name: sprint.name,
        goal: sprint.goal || "",
        status: sprint.status,
        start_date: sprint.start_date ? dayjs(sprint.start_date) : undefined,
        end_date: sprint.end_date ? dayjs(sprint.end_date) : undefined,
      });
    } else {
      sprintForm.resetFields();
      sprintForm.setFieldsValue({ status: "planning" });
    }
    setShowSprintForm(true);
  };

  const handleSaveSprint = async (values) => {
    try {
      const payload = {
        project_id: selectedProject?.id,
        name: values.name,
        goal: values.goal || null,
        status: values.status,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : null,
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
      };
      if (editingSprint) {
        const { error } = await supabase
          .from("sprints")
          .update(payload)
          .eq("id", editingSprint.id);
        if (error) throw error;
        message.success("Sprint updated");
      } else {
        const { error } = await supabase
          .from("sprints")
          .insert([{ ...payload, created_by: profile?.id }]);
        if (error) throw error;
        message.success("Sprint created");
      }
      await fetchProjectData(selectedProject.id);
      setShowSprintForm(false);
      sprintForm.resetFields();
      setEditingSprint(null);
    } catch (err) {
      message.error("Failed: " + err.message);
    }
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t,
      ),
    );
    if (detailTicket?.id === updatedTicket.id)
      setDetailTicket((prev) => ({ ...prev, ...updatedTicket }));
  };

  const backlogTickets = tickets.filter((t) => !t.sprint_id);
  const sprintTickets = (sprintId) =>
    tickets.filter((t) => t.sprint_id === sprintId);
  const filteredTickets = (list) =>
    searchQ
      ? list.filter((t) =>
          t.title.toLowerCase().includes(searchQ.toLowerCase()),
        )
      : list;

  const backlogEpics = backlogTickets.filter((t) => t.ticket_type === "epic");
  const backlogOrphans = backlogTickets.filter(
    (t) => t.ticket_type !== "epic" && !t.parent_id,
  );

  const totalTickets = tickets.length;
  const doneTickets = tickets.filter(
    (t) => t.status === "completed" || t.status === "closed",
  ).length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  const watchedType = Form.useWatch("ticket_type", ticketForm);

  if (!profile)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: dark ? "#141416" : "#f4f5f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        .pm-scroll::-webkit-scrollbar { height: 5px; width: 5px }
        .pm-scroll::-webkit-scrollbar-track { background: ${dark ? "#23242a" : "#f1f2f4"}; border-radius: 3px }
        .pm-scroll::-webkit-scrollbar-thumb { background: ${dark ? "#3a3c45" : "#c1c7d0"}; border-radius: 3px }
        .ant-select-selection-item .ant-space { flex-wrap: nowrap; }

        .pm-root.dark { color: #f3f4f6; }
        .pm-root.dark [style*="background: #fff"],
        .pm-root.dark [style*="background:#fff"],
        .pm-root.dark [style*="background: #ffffff"] { background: #1a1b1f !important; }
        .pm-root.dark [style*="background: #f4f5f7"],
        .pm-root.dark [style*="background:#f4f5f7"],
        .pm-root.dark [style*="background: #fafafa"],
        .pm-root.dark [style*="background:#fafafa"] { background: #141416 !important; }
        .pm-root.dark [style*="background: #f1f2f4"],
        .pm-root.dark [style*="background:#f1f2f4"],
        .pm-root.dark [style*="background: #f8fafc"],
        .pm-root.dark [style*="background:#f8fafc"] { background: #202127 !important; }
        .pm-root.dark [style*="border: 1px solid #dde3ec"],
        .pm-root.dark [style*="border:1px solid #dde3ec"],
        .pm-root.dark [style*="border-bottom: 1px solid #f1f2f4"],
        .pm-root.dark [style*="border-bottom:1px solid #f1f2f4"],
        .pm-root.dark [style*="border: 1px solid #e5e7eb"],
        .pm-root.dark [style*="border:1px solid #e5e7eb"] { border-color: #2a2b31 !important; }
        .pm-root.dark [style*="border: 1.5px dashed #dde3ec"] { border-color: #2a2b31 !important; }
        .pm-root.dark [style*="color: #172b4d"],
        .pm-root.dark [style*="color:#172b4d"],
        .pm-root.dark [style*="color: #374151"] { color: #f3f4f6 !important; }
        .pm-root.dark [style*="color: #626f86"],
        .pm-root.dark [style*="color:#626f86"],
        .pm-root.dark [style*="color: #94a3b8"],
        .pm-root.dark [style*="color:#94a3b8"],
        .pm-root.dark [style*="color: #9ca3af"] { color: #9ca3af !important; }
        .pm-root.dark .ant-drawer-header,
        .pm-root.dark .ant-drawer-body,
        .pm-root.dark .ant-drawer-footer,
        .pm-root.dark .ant-modal-content,
        .pm-root.dark .ant-modal-header,
        .pm-root.dark .ant-modal-body,
        .pm-root.dark .ant-modal-footer {
          background: #1a1b1f !important;
          border-color: #2a2b31 !important;
          color: #f3f4f6 !important;
        }
        .pm-root.dark .ant-modal-title,
        .pm-root.dark .ant-drawer-title { color: #f3f4f6 !important; }
        .pm-root.dark .ant-input,
        .pm-root.dark .ant-input-affix-wrapper,
        .pm-root.dark .ant-select-selector,
        .pm-root.dark .ant-picker {
          background: #17181c !important;
          color: #f3f4f6 !important;
          border-color: #2a2b31 !important;
        }

        .pm-dark-overlay .ant-drawer-content,
        .pm-dark-overlay .ant-drawer-header,
        .pm-dark-overlay .ant-drawer-body,
        .pm-dark-overlay .ant-drawer-footer,
        .pm-dark-overlay .ant-modal-content,
        .pm-dark-overlay .ant-modal-header,
        .pm-dark-overlay .ant-modal-body,
        .pm-dark-overlay .ant-modal-footer {
          background: #1a1b1f !important;
          color: #f3f4f6 !important;
          border-color: #2a2b31 !important;
        }
        .pm-dark-overlay .ant-drawer-title,
        .pm-dark-overlay .ant-modal-title { color: #f3f4f6 !important; }
        .pm-dark-overlay .ant-input,
        .pm-dark-overlay .ant-input-affix-wrapper,
        .pm-dark-overlay .ant-select-selector,
        .pm-dark-overlay .ant-picker {
          background: #17181c !important;
          color: #f3f4f6 !important;
          border-color: #2a2b31 !important;
        }
      `}</style>

      {!embedded && (
        <div
          className={`pm-root ${dark ? "dark" : ""}`}
          style={{
            minHeight: "100vh",
            background: dark ? "#141416" : "#f4f5f7",
          }}
        >
          <div style={{ margin: "0 auto", padding: "24px 20px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 2px",
                }}
              >
                Projects
              </h1>
              <p style={{ fontSize: 12, color: "#626f86", margin: 0 }}>
                Manage sprints, tickets, and team delivery
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Total", val: projects.length, color: "#ce4f12" },
                {
                  label: "Active",
                  val: projects.filter((p) => p.status === "in_progress")
                    .length,
                  color: "#0c66e4",
                },
                {
                  label: "Done",
                  val: projects.filter((p) => p.status === "completed").length,
                  color: "#22a06b",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: dark ? "#1a1b1f" : "#fff",
                    border: dark ? "1px solid #2a2b31" : "1px solid #dde3ec",
                    borderRadius: 8,
                    padding: "7px 14px",
                    textAlign: "center",
                    minWidth: 60,
                  }}
                >
                  <div
                    style={{ fontSize: 18, fontWeight: 800, color: s.color }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#9ca3af",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects grid */}
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div
              className="pm-scroll"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
                overflowX: "auto",
              }}
            >
              {PROJECT_STATUS.map((ps) => {
                const cols = projects.filter((p) => p.status === ps.key);
                return (
                  <div key={ps.key}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 6,
                        marginBottom: 10,
                        background: dark ? `${ps.color}20` : ps.bg,
                        border: dark
                          ? `1.5px solid ${ps.color}55`
                          : `1.5px solid ${ps.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: ps.color,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: ps.color,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {ps.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: ps.color,
                          background: dark ? "#1a1b1f" : "#fff",
                          padding: "1px 7px",
                          borderRadius: 99,
                          border: dark
                            ? "1px solid #2a2b31"
                            : `1px solid ${ps.border}`,
                        }}
                      >
                        {cols.length}
                      </span>
                    </div>
                    <div style={{ minHeight: 140 }}>
                      {cols.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          dark={dark}
                          onClick={() => openProject(p)}
                        />
                      ))}
                      {cols.length === 0 && (
                        <div
                          style={{
                            border: dark
                              ? "1.5px dashed #2a2b31"
                              : "1.5px dashed #dde3ec",
                            borderRadius: 8,
                            padding: "28px 14px",
                            textAlign: "center",
                            background: dark ? "#1a1b1f" : "transparent",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              color: dark ? "#6b7280" : "#d1d5db",
                              margin: 0,
                            }}
                          >
                            No projects
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {/* --- PROJECT DRAWER --- */}
      <Drawer
        open={showProjectDrawer}
        rootClassName={dark ? "pm-dark-overlay" : undefined}
        onClose={closeProjectDrawer}
        width="96%"
        styles={{
          header: {
            padding: "12px 18px",
            borderBottom: "1px solid #f1f2f4",
            background: "#fff",
          },
          body: { padding: 0, background: "#f4f5f7" },
        }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "linear-gradient(135deg,#003467,#0c66e4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={15} color="#fff" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: dark ? "#f3f4f6" : "#172b4d",
                  }}
                >
                  {selectedProject?.name}
                </div>
                <div style={{ fontSize: 10, color: dark ? "#9ca3af" : "#94a3b8" }}>
                  {selectedProject?.description}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7, marginRight: 40 }}>
              {[
                { label: "Tickets", val: totalTickets, color: "#003467" },
                { label: "Open", val: openTickets, color: "#f97316" },
                { label: "Done", val: doneTickets, color: "#22a06b" },
                { label: "Sprints", val: sprints.length, color: "#0c66e4" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: dark ? "#1f222a" : "#f4f5f7",
                    border: `1px solid ${dark ? "#313540" : "#dde3ec"}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    textAlign: "center",
                    minWidth: 52,
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 800, color: s.color }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#9ca3af",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
        extra={
          <Space>
            <Tooltip
              title={
                clientProgressInvite?.share_token
                  ? "Open client progress link"
                  : "No client progress link found for this project yet"
              }
            >
              <Button
                icon={<ExternalLink size={12} />}
                size="small"
                disabled={!clientProgressInvite?.share_token}
                onClick={() => {
                  if (!clientProgressInvite?.share_token) return;
                  window.open(
                    `${window.location.origin}/client/project-progress/${clientProgressInvite.share_token}`,
                    "_blank",
                  );
                }}
              >
                Open Progress Link
              </Button>
            </Tooltip>
            <Button
              icon={<Sparkles size={12} />}
              onClick={() => setShowAiPlanner(true)}
              size="small"
              style={{
                background: dark
                  ? "linear-gradient(135deg,#2a2440,#1e3a8a)"
                  : "linear-gradient(135deg,#ede9fe,#e0e7ff)",
                border: dark ? "1px solid #3b3d46" : "1px solid #c7d2fe",
                color: dark ? "#dbeafe" : "#4338ca",
                fontWeight: 600,
              }}
            >
              AI Sprint Planner
            </Button>
            <Button
              icon={<Zap size={12} />}
              onClick={() => openSprintForm()}
              size="small"
            >
              New Sprint
            </Button>
            <Button
              type="primary"
              icon={<Plus size={12} />}
              onClick={() => openTicketForm(null, null, "open")}
              size="small"
              style={{
                background: "linear-gradient(135deg,#003467,#0c66e4)",
                border: "none",
              }}
            >
              Create Issue
            </Button>
          </Space>
        }
      >
        <div style={{ padding: "0 18px 24px" }}>
          {/* Tabs + search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: `1px solid ${dark ? "#2a2d36" : "#e5e7eb"}`,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 0,
                background: dark ? "#1f2229" : "#f1f2f4",
                padding: 3,
                borderRadius: 6,
                border: dark ? "1px solid #2f3440" : "none",
              }}
            >
              {["board", "backlog"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all .15s",
                    background: activeTab === t ? (dark ? "#2a2e38" : "#fff") : "transparent",
                    color: activeTab === t ? (dark ? "#f3f4f6" : "#172b4d") : dark ? "#a9afbd" : "#626f86",
                    boxShadow:
                      activeTab === t
                        ? dark
                          ? "0 1px 8px rgba(0,0,0,.35)"
                          : "0 1px 3px rgba(0,0,0,.1)"
                        : "none",
                  }}
                >
                  {t === "board" ? "Board" : "Backlog"}
                  {t === "backlog" && backlogTickets.length > 0 && (
                    <span
                      style={{
                        marginLeft: 4,
                        background: activeTab === t ? (dark ? "#1f345e" : "#e0e7ff") : dark ? "#2d323d" : "#e5e7eb",
                        color: activeTab === t ? (dark ? "#bfdbfe" : "#4338ca") : dark ? "#b4bccb" : "#6b7280",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 99,
                      }}
                    >
                      {backlogTickets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: dark ? "#1d2027" : "#fff",
                border: `1px solid ${dark ? "#313540" : "#dde3ec"}`,
                borderRadius: 6,
                padding: "5px 10px",
              }}
            >
              <Search size={12} color={dark ? "#9098a8" : "#9ca3af"} />
              <input
                placeholder="Search issues"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: dark ? "#f3f4f6" : "#172b4d",
                  width: 150,
                  background: "transparent",
                }}
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: dark ? "#9098a8" : "#9ca3af",
                      display: "flex",
                    }}
                  >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* BOARD */}
          {activeTab === "board" &&
            (loadingData ? (
              <SkeletonBoard dark={dark} />
            ) : (
              <div>
                {sprints.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 0",
                      background: dark ? "#1a1c23" : "#fff",
                      borderRadius: 10,
                      border: `1.5px dashed ${dark ? "#343946" : "#dde3ec"}`,
                    }}
                  >
                    <Zap
                      size={32}
                      color={dark ? "#3a3f4c" : "#dde3ec"}
                      style={{ margin: "0 auto 10px" }}
                    />
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: dark ? "#f3f4f6" : "#374151",
                        marginBottom: 3,
                      }}
                    >
                      No sprints yet
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: dark ? "#9ca3af" : "#9ca3af",
                        marginBottom: 16,
                      }}
                    >
                      Create your first sprint to start organising tickets
                    </p>
                    <Button
                      type="primary"
                      icon={<Plus size={13} />}
                      onClick={() => openSprintForm()}
                      style={{
                        background: "linear-gradient(135deg,#003467,#0c66e4)",
                        border: "none",
                      }}
                    >
                      Create Sprint
                    </Button>
                  </div>
                ) : (
                  sprints.map((sprint) => (
                    <SprintBoard
                      key={sprint.id}
                      sprint={sprint}
                      tickets={filteredTickets(sprintTickets(sprint.id))}
                      allTickets={tickets}
                      onTicketClick={(t) => setDetailTicket(t)}
                      onNewTicket={(s, status) =>
                        openTicketForm(null, s.id, status)
                      }
                      onEditSprint={openSprintForm}
                      onGroupDragStart={handleGroupDragStart}
                      onDragEnd={handleDragEnd}
                      draggingGroup={draggingGroup}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDelete={handleDeleteTicket}
                      projectAssignees={
                        selectedProject?.project_assignees || []
                      }
                      dark={dark}
                    />
                  ))
                )}
              </div>
            ))}

          {/* BACKLOG */}
          {activeTab === "backlog" &&
            (loadingData ? (
              <SkeletonBacklog dark={dark} />
            ) : (
              <div
                style={{
                  background: dark ? "#17181c" : "#fff",
                  borderRadius: 8,
                  border: `1px solid ${dark ? "#2a2d36" : "#dde3ec"}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                    background: dark ? "#1d2027" : "#fafafa",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <Inbox size={13} color={dark ? "#a9afbd" : "#626f86"} />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: dark ? "#f3f4f6" : "#172b4d",
                      }}
                    >
                      Backlog
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: dark ? "#a9afbd" : "#626f86",
                        background: dark ? "#2a2f39" : "#f1f2f4",
                        padding: "2px 7px",
                        borderRadius: 99,
                      }}
                    >
                      {backlogTickets.length} issues
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      onClick={() =>
                        openTicketForm(null, null, "open", null, "epic")
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: dark ? "#2b2540" : "#f8f5ff",
                        border: `1px solid ${dark ? "#4a3f72" : "#c4b5fd"}`,
                        color: dark ? "#c4b5fd" : "#7c3aed",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={11} /> New Epic
                    </button>
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: dark ? "#1d2f4f" : "#e9f2ff",
                        border: `1px solid ${dark ? "#2f4d75" : "#b8d0f5"}`,
                        color: dark ? "#93c5fd" : "#0c66e4",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={11} /> Quick Add
                    </button>
                  </div>
                </div>

                {showQuickAdd && (
                  <QuickAddRow
                    allowedTypes={["story", "task", "bug"]}
                    onAdd={handleQuickAdd}
                    onCancel={() => setShowQuickAdd(false)}
                  />
                )}

                {/* Epics */}
                {filteredTickets(backlogEpics).length > 0 && (
                  <>
                    <div
                      style={{
                        padding: "6px 14px",
                        background: dark ? "#241f33" : "#f8f5ff",
                        borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#7c3aed",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Epics
                      </span>
                    </div>
                    {filteredTickets(backlogEpics).map((epic) => (
                      <BacklogEpicRow
                        key={epic.id}
                        epic={epic}
                        allTickets={tickets}
                        onEdit={openTicketForm}
                        onTicketClick={(t) => setDetailTicket(t)}
                        onNewChild={handleNewChildFromBacklog}
                        onDragStart={(t) =>
                          handleGroupDragStart({
                            leadId: t.id,
                            lead: t,
                            memberIds: [],
                            members: [],
                          })
                        }
                        onDragEnd={handleDragEnd}
                        isDragging={draggingGroup?.leadId}
                        onDelete={handleDeleteTicket}
                        projectAssignees={
                          selectedProject?.project_assignees || []
                        }
                        dark={dark}
                      />
                    ))}
                  </>
                )}

                {/* Orphans */}
                {filteredTickets(backlogOrphans).length > 0 && (
                  <>
                    <div
                      style={{
                        padding: "6px 14px",
                        background: dark ? "#1f2229" : "#f4f5f7",
                        borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                        borderTop: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: dark ? "#a9afbd" : "#626f86",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Unassigned to Epic
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 14px",
                        borderBottom: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                        background: dark ? "#1d2027" : "#fafafa",
                      }}
                    >
                      <div style={{ width: 12 }} />
                      <div style={{ width: 10 }} />
                      <div style={{ width: 72 }} />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Title
                      </span>
                      <span
                        style={{
                          width: 80,
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Priority
                      </span>
                      <span
                        style={{
                          width: 80,
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Status
                      </span>
                      <span
                        style={{
                          width: 34,
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          textAlign: "center",
                        }}
                      >
                        Pts
                      </span>
                      <span style={{ width: 20 }} />
                      <span style={{ width: 20 }} />
                      <span style={{ width: 20 }} />
                    </div>
                    {filteredTickets(backlogOrphans).map((t) => (
                      <BacklogChildRow
                        key={t.id}
                        ticket={t}
                        allTickets={tickets}
                        onEdit={openTicketForm}
                        onTicketClick={(ticket) => setDetailTicket(ticket)}
                        onNewChild={handleNewChildFromBacklog}
                        onDragStart={(t) =>
                          handleGroupDragStart({
                            leadId: t.id,
                            lead: t,
                            memberIds: [],
                            members: [],
                          })
                        }
                        onDragEnd={handleDragEnd}
                        isDragging={draggingGroup?.leadId === t.id}
                      onDelete={handleDeleteTicket}
                      projectAssignees={
                        selectedProject?.project_assignees || []
                      }
                      dark={dark}
                    />
                    ))}
                  </>
                )}

                {backlogEpics.length === 0 && backlogOrphans.length === 0 && (
                  <div style={{ textAlign: "center", padding: "44px 0" }}>
                    <CheckCircle2
                      size={28}
                      color={dark ? "#3a3f4c" : "#dde3ec"}
                      style={{ margin: "0 auto 8px" }}
                    />
                    <p style={{ fontSize: 13, color: dark ? "#9ca3af" : "#9ca3af", margin: 0 }}>
                      Backlog is empty
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: dark ? "#6b7280" : "#d1d5db",
                        margin: "3px 0 0",
                      }}
                    >
                      All tickets are in sprints
                    </p>
                  </div>
                )}

                <div
                  style={{
                    padding: "10px 14px",
                    borderTop: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
                  }}
                >
                  <button
                    onClick={() => openTicketForm(null, null, "open")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#0c66e4",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 0",
                    }}
                  >
                    <Plus size={13} /> Create issue with full details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Drawer>

      {/* --- TICKET DETAIL MODAL --- */}
      {detailTicket && (
        <TicketDetailsModal
          open={!!detailTicket}
          ticket={detailTicket}
          sprints={sprints}
          projectAssignees={selectedProject?.project_assignees || []}
          lockFieldsForPM
          onClose={() => setDetailTicket(null)}
          onRefresh={() => fetchProjectData(selectedProject?.id)}
        />
      )}

      {/* --- TICKET FORM DRAWER --- */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color={dark ? "#93c5fd" : "#4338ca"} />
            <span style={{ fontWeight: 700, color: dark ? "#f3f4f6" : "#172b4d" }}>
              AI Sprint Planner
            </span>
          </div>
        }
        open={showAiPlanner}
        rootClassName={dark ? "pm-dark-overlay" : undefined}
        onCancel={() => {
          if (aiPlannerLoading || aiPlannerApplying) return;
          setShowAiPlanner(false);
        }}
        width={760}
        footer={
          <Space>
            <Button
              onClick={() => {
                setShowAiPlanner(false);
                setAiPlannerResult(null);
                setAiProjectBrief("");
                setAiPlannerFile(null);
              }}
              disabled={aiPlannerLoading || aiPlannerApplying}
            >
              Close
            </Button>
            <Button
              onClick={runAiPlanner}
              loading={aiPlannerLoading}
              icon={<Sparkles size={13} />}
            >
              Generate Plan
            </Button>
            <Button
              type="primary"
              onClick={applyAiPlannerResult}
              loading={aiPlannerApplying}
              disabled={!aiPlannerResult}
              style={{
                background: "linear-gradient(135deg,#003467,#0c66e4)",
                border: "none",
                fontWeight: 600,
              }}
            >
              Create Sprints & Tickets
            </Button>
          </Space>
        }
        styles={{
          content: {
            background: dark ? "#1a1b1f" : "#ffffff",
            border: dark ? "1px solid #2a2b31" : "1px solid #e5e7eb",
          },
          header: { background: dark ? "#1a1b1f" : "#ffffff" },
          body: { background: dark ? "#1a1b1f" : "#ffffff" },
          footer: { background: dark ? "#1a1b1f" : "#ffffff" },
        }}
      >
        <div
          style={{
            marginBottom: 12,
            fontSize: 12,
            color: dark ? "#9ca3af" : "#6b7280",
          }}
        >
          Describe project scope, outcomes, constraints, timeline and dependencies.
          AI will generate sprint plan and backlog tickets.
        </div>
        <TextArea
          rows={6}
          value={aiProjectBrief}
          onChange={(e) => setAiProjectBrief(e.target.value)}
          placeholder="Example: Build multi-tenant PM platform with auth, project boards, ticketing, notifications, reporting, and role-based access. Deadline 10 weeks."
          style={{
            background: dark ? "#17181c" : "#ffffff",
            borderColor: dark ? "#2a2b31" : "#d1d5db",
            color: dark ? "#f3f4f6" : "#111827",
          }}
        />
        <div style={{ marginTop: 12, marginBottom: 14 }}>
          <label
            htmlFor="ai-planner-upload"
            style={{
              display: "block",
              border: `1px dashed ${dark ? "#3a3f4d" : "#cbd5e1"}`,
              borderRadius: 10,
              padding: "12px 14px",
              background: dark ? "#17181c" : "#f8fafc",
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: dark ? "#20232b" : "#e9f2ff",
                  border: `1px solid ${dark ? "#2f3440" : "#bfdbfe"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Upload size={14} color={dark ? "#93c5fd" : "#0c66e4"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: dark ? "#f3f4f6" : "#172b4d",
                    marginBottom: 1,
                  }}
                >
                  Upload reference file
                </div>
                <div style={{ fontSize: 11, color: dark ? "#9ca3af" : "#6b7280" }}>
                  Supported: `.md`, `.pdf`, `.doc`, `.docx`, `.txt`, `.json`, `.csv`
                </div>
              </div>
            </div>
          </label>
          <input
            id="ai-planner-upload"
            type="file"
            accept=".md,.pdf,.doc,.docx,.txt,.json,.csv"
            onChange={(e) => setAiPlannerFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          {aiPlannerFile && (
            <div
              style={{
                marginTop: 8,
                borderRadius: 8,
                border: `1px solid ${dark ? "#2f3440" : "#dbe2ea"}`,
                background: dark ? "#1d2027" : "#ffffff",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: dark ? "#f3f4f6" : "#172b4d",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {aiPlannerFile.name}
                </div>
                <div style={{ fontSize: 11, color: dark ? "#9ca3af" : "#6b7280" }}>
                  {(aiPlannerFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => setAiPlannerFile(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: dark ? "#9ca3af" : "#6b7280",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {aiPlannerResult && (
          <div
            style={{
              border: `1px solid ${dark ? "#2a2b31" : "#e5e7eb"}`,
              background: dark ? "#17181c" : "#f9fafb",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                color: dark ? "#d1d5db" : "#374151",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>Sprints: {aiPlannerResult.sprints.length}</span>
              <span>Tickets: {aiPlannerResult.tickets.length}</span>
            </div>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {aiPlannerResult.tickets.slice(0, 20).map((tk, i) => (
                <div
                  key={`${tk.key}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: `1px solid ${dark ? "#2a2b31" : "#f1f5f9"}`,
                  }}
                >
                  <Tag style={{ margin: 0 }}>{tk.ticket_type}</Tag>
                  <span
                    style={{
                      color: dark ? "#f3f4f6" : "#111827",
                      fontSize: 12,
                      flex: 1,
                    }}
                  >
                    {tk.title}
                  </span>
                  <span
                    style={{ color: dark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                  >
                    {tk.sprint_name || "Backlog"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: editingTicket
                  ? dark
                    ? "#282c3a"
                    : "#f0f0ff"
                  : "linear-gradient(135deg,#003467,#0c66e4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editingTicket ? (
                <Edit2 size={12} color={dark ? "#c4b5fd" : "#6366f1"} />
              ) : (
                <Plus size={12} color="#fff" />
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: dark ? "#f3f4f6" : "#172b4d",
              }}
            >
              {editingTicket ? "Edit Issue" : "Create Issue"}
            </span>
          </div>
        }
        placement="right"
        width={580}
        open={showTicketForm}
        rootClassName={dark ? "pm-dark-overlay" : undefined}
        onClose={() => {
          setShowTicketForm(false);
          ticketForm.resetFields();
          setEditingTicket(null);
          setAiSuggestion(null);
        }}
        footer={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={runAIAnalysis}
              loading={aiLoading}
              icon={<Sparkles size={12} />}
              style={{
                background: dark
                  ? "linear-gradient(135deg,#232744,#1e2239)"
                  : "linear-gradient(135deg,#f0f0ff,#fdf4ff)",
                border: `1px solid ${dark ? "#3e3f6d" : "#c7d2fe"}`,
                color: dark ? "#c4b5fd" : "#6366f1",
                fontWeight: 600,
              }}
            >
              {aiLoading ? "Analyzing" : "AI Suggest"}
            </Button>
            <Space>
              <Button
                onClick={() => {
                  setShowTicketForm(false);
                  ticketForm.resetFields();
                  setEditingTicket(null);
                  setAiSuggestion(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => ticketForm.submit()}
                style={{
                  background: "linear-gradient(135deg,#003467,#0c66e4)",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {editingTicket ? "Update" : "Create"} Issue
              </Button>
            </Space>
          </div>
        }
        styles={{
          footer: {
            padding: "10px 14px",
            borderTop: `1px solid ${dark ? "#2a2d36" : "#f1f2f4"}`,
            background: dark ? "#17181c" : "#fff",
          },
        }}
      >
        {aiSuggestion && (
          <AISuggestionBanner
            suggestion={aiSuggestion}
            onApply={applyAISuggestion}
            onDismiss={() => setAiSuggestion(null)}
            dark={dark}
          />
        )}

        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleSaveTicket}
          style={{ padding: "0 2px" }}
        >
          <Form.Item
            name="ticket_type"
            label="Issue Type"
            rules={[{ required: true }]}
          >
            <Select size="large">
              {Object.entries(TICKET_TYPE).map(([k, v]) => (
                <Option key={k} value={k}>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span
                      style={{
                        background: v.bg,
                        color: v.color,
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        border: `1px solid ${v.color}30`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {v.icon} {v.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {v.description}
                    </span>
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Summary"
            rules={[{ required: true, message: "Summary required" }]}
          >
            <Input placeholder="What needs to be done?" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Add more context" size="large" />
          </Form.Item>

          {!aiSuggestion && !aiLoading && (
            <div
              style={{
                marginBottom: 14,
                padding: "7px 10px",
                background: dark ? "#22263a" : "#f8f8ff",
                border: `1px solid ${dark ? "#3a4060" : "#e0e7ff"}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={11} color={dark ? "#a5b4fc" : "#6366f1"} />
              <span style={{ fontSize: 11, color: dark ? "#c4b5fd" : "#6366f1" }}>
                Fill in title & description, then click{" "}
                <strong>AI Suggest</strong> for auto-analysis
              </span>
            </div>
          )}

          {watchedType && getAllowedParentTypes(watchedType).length > 0 && (
            <Form.Item
              name="parent_id"
              label={
                <span>
                  Parent{" "}
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>
                    ({getAllowedParentTypes(watchedType).join(" or ")})
                  </span>
                </span>
              }
            >
              <Select
                size="large"
                allowClear
                placeholder="No parent (backlog root)"
              >
                {getParentOptions(watchedType).map((t) => {
                  const tt = TICKET_TYPE[t.ticket_type];
                  return (
                    <Option key={t.id} value={t.id}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span
                          style={{
                            background: tt?.bg,
                            color: tt?.color,
                            padding: "1px 5px",
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {tt?.label}
                        </span>
                        {t.title}
                      </span>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true }]}
            >
              <Select size="large">
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: v.dot,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ color: v.color, fontWeight: 600 }}>
                        {v.label}
                      </span>
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select size="large">
                {TICKET_STATUS.map((s) => (
                  <Option key={s.key} value={s.key}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* --- MULTI-ASSIGNEE FIELD IN FORM --- */}
          <Form.Item
            name="assigned_to_ids"
            label={
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Users size={12} color="#6b7280" />
                Assignees
                <span
                  style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}
                >
                  (select one or more)
                </span>
              </span>
            }
          >
            <Select
              mode="multiple"
              size="large"
              allowClear
              placeholder="Unassigned - click to assign team members"
              maxTagCount={3}
              maxTagPlaceholder={(omitted) => `+${omitted.length} more`}
              optionLabelProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              style={{ width: "100%" }}
            >
              {selectedProject?.project_assignees?.map((a) => (
                <Option
                  key={a.profiles.id}
                  value={a.profiles.id}
                  label={a.profiles.full_name}
                >
                  <Space size={8}>
                    <UserAvatar
                      name={a.profiles.full_name}
                      image={a?.profiles?.user_photo}
                      size={20}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                      >
                        {a.profiles.full_name}
                      </div>
                      {a.profiles.email && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#9ca3af",
                            lineHeight: 1.3,
                          }}
                        >
                          {a.profiles.email}
                        </div>
                      )}
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Form.Item
              name="story_points"
              label={
                <span>
                  Story Points{" "}
                  {watchedType === "subtask" && (
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>
                      (1-3)
                    </span>
                  )}
                </span>
              }
            >
              <Select size="large">
                {[0, 1, 2, 3, 5, 8, 13, 21].map((n) => (
                  <Option key={n} value={n}>
                    {n === 0 ? "Unestimated" : `${n} pt${n !== 1 ? "s" : ""}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {watchedType !== "epic" && watchedType !== "subtask" ? (
              <Form.Item name="sprint_id" label="Sprint">
                <Select size="large" allowClear placeholder="Backlog">
                  {sprints.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  paddingBottom: 24,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    fontStyle: "italic",
                  }}
                >
                  {watchedType === "epic"
                    ? "Epics span multiple sprints"
                    : "Subtasks inherit sprint from parent"}
                </span>
              </div>
            )}
          </div>

          <Form.Item name="due_date" label="Due Date">
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format="MMM D, YYYY"
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* --- SPRINT FORM DRAWER --- */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: "linear-gradient(135deg,#0c66e4,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#172b4d" }}>
              {editingSprint ? "Edit Sprint" : "New Sprint"}
            </span>
          </div>
        }
        placement="right"
        width={460}
        open={showSprintForm}
        rootClassName={dark ? "pm-dark-overlay" : undefined}
        onClose={() => {
          setShowSprintForm(false);
          sprintForm.resetFields();
          setEditingSprint(null);
        }}
        footer={
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setShowSprintForm(false);
                  sprintForm.resetFields();
                  setEditingSprint(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => sprintForm.submit()}
                style={{
                  background: "linear-gradient(135deg,#0c66e4,#6366f1)",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {editingSprint ? "Update" : "Create"} Sprint
              </Button>
            </Space>
          </div>
        }
        styles={{
          footer: { padding: "10px 14px", borderTop: "1px solid #f1f2f4" },
        }}
      >
        <Form form={sprintForm} layout="vertical" onFinish={handleSaveSprint}>
          <Form.Item
            name="name"
            label="Sprint Name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input
              placeholder="e.g. Sprint 1 - Auth & Onboarding"
              size="large"
            />
          </Form.Item>
          <Form.Item name="goal" label="Sprint Goal">
            <TextArea
              rows={2}
              placeholder="What will the team achieve?"
              size="large"
            />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Form.Item name="start_date" label="Start Date">
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                format="MMM D, YYYY"
              />
            </Form.Item>
            <Form.Item name="end_date" label="End Date">
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                format="MMM D, YYYY"
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default PMProjects;




