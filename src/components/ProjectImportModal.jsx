import { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Button, message, Checkbox, Progress } from "antd";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  buildAiPromptForMapping,
  parseAiJsonResponse,
  executeBulkMappedImport,
  normalizeMappedPayload,
} from "../lib/externalProjectImport";
import {
  fetchJiraBundleViaBackend,
  listJiraProjectsViaBackend,
} from "../pages/integrations/Jira/api";
import {
  fetchAsanaBundleViaBackend,
  getAsanaBackendAuthUrl,
  listAsanaProjectsViaBackend,
} from "../pages/integrations/Asana/api";
import {
  fetchTrelloBundleViaBackend,
  getTrelloBackendAuthUrl,
  listTrelloProjectsViaBackend,
} from "../pages/integrations/Trello/api";
import {
  fetchClickUpBundleViaBackend,
  getClickUpBackendAuthUrl,
  listClickUpProjectsViaBackend,
} from "../pages/integrations/ClickUp/api";

const JIRA_CONNECTED_STORAGE_KEY = "jira_backend_connected_at";
const ASANA_CONNECTED_STORAGE_KEY = "asana_backend_connected_at";
const TRELLO_CONNECTED_STORAGE_KEY = "trello_backend_connected_at";
const CLICKUP_CONNECTED_STORAGE_KEY = "clickup_backend_connected_at";
const LOGO_SIZE = 26;

const JiraLogo = () => (
  <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="3" y="3" width="26" height="26" rx="8" fill="#0B66E4" />
    <path d="M10 15.6L16.5 9l5.5 5.6-6.5 6.4z" fill="#fff" />
    <circle cx="16.5" cy="22.4" r="2.2" fill="#93C5FD" />
  </svg>
);

const AsanaLogo = () => (
  <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="9.5" cy="22" r="5.5" fill="#F06A6A" />
    <circle cx="22.5" cy="22" r="5.5" fill="#FC8E53" />
    <circle cx="16" cy="10" r="5.5" fill="#F9BF5F" />
  </svg>
);

const TrelloLogo = () => (
  <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="3" y="3" width="26" height="26" rx="7" fill="#0079BF" />
    <rect x="9" y="9" width="6.5" height="14" rx="2.2" fill="#fff" />
    <rect x="17.5" y="9" width="5.5" height="9" rx="2" fill="#fff" />
  </svg>
);

const ClickUpLogo = () => (
  <svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="3" y="3" width="26" height="26" rx="7" fill="#7B68EE" />
    <path
      d="M10 11.5l6 6 6-6"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 20h8"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const STEPS = [
  { id: 1, label: "Source" },
  { id: 2, label: "Connect" },
  { id: 3, label: "Projects" },
  { id: 4, label: "Import" },
];

const SOURCES = [
  {
    id: "jira",
    title: "Jira",
    subtitle: "OAuth via backend API",
    accent: "#2684FF",
    bg: "linear-gradient(135deg, rgba(38,132,255,0.12) 0%, rgba(38,132,255,0.02) 100%)",
    logo: <JiraLogo />,
  },
  {
    id: "asana",
    title: "Asana",
    subtitle: "OAuth via backend API",
    accent: "#F06A6A",
    bg: "linear-gradient(135deg, rgba(240,106,106,0.12) 0%, rgba(240,106,106,0.02) 100%)",
    logo: <AsanaLogo />,
  },
  {
    id: "trello",
    title: "Trello",
    subtitle: "OAuth via backend API",
    accent: "#0079BF",
    bg: "linear-gradient(135deg, rgba(0,121,191,0.12) 0%, rgba(0,121,191,0.02) 100%)",
    logo: <TrelloLogo />,
  },
  {
    id: "clickup",
    title: "ClickUp",
    subtitle: "OAuth via backend API",
    accent: "#7B68EE",
    bg: "linear-gradient(135deg, rgba(123,104,238,0.14) 0%, rgba(123,104,238,0.03) 100%)",
    logo: <ClickUpLogo />,
  },
];

const MAX_BULK = 8;

export default function ProjectImportModal({
  open,
  onClose,
  tenantId,
  groq,
  onImported,
  isDark,
  asPage = false,
}) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState("jira");
  const [userId, setUserId] = useState(null);

  const [jiraConnected, setJiraConnected] = useState(false);
  const [jiraList, setJiraList] = useState([]);
  const [jiraLoading, setJiraLoading] = useState(false);

  const [asanaConnected, setAsanaConnected] = useState(false);
  const [asanaList, setAsanaList] = useState([]);
  const [asanaLoading, setAsanaLoading] = useState(false);

  const [trelloList, setTrelloList] = useState([]);
  const [trelloLoading, setTrelloLoading] = useState(false);
  const [trelloConnected, setTrelloConnected] = useState(false);

  const [clickUpConnected, setClickUpConnected] = useState(false);
  const [clickUpList, setClickUpList] = useState([]);
  const [clickUpLoading, setClickUpLoading] = useState(false);

  const [remoteItems, setRemoteItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [mapProgress, setMapProgress] = useState("");
  const [mappedPayload, setMappedPayload] = useState(null);
  const [mapping, setMapping] = useState(false);

  const [importing, setImporting] = useState(false);
  const [createSprintAfterImport, setCreateSprintAfterImport] = useState(true);

  useEffect(() => {
    if (!open && !asPage) return;
    setStep(1);
    setSource("jira");
    setMappedPayload(null);
    setMapProgress("");
    setCreateSprintAfterImport(true);
    setSelectedIds(new Set());
    setRemoteItems([]);
    const params = new URLSearchParams(window.location.search || "");
    const jiraFromQuery = params.get("jira_connected") === "1";
    const asanaFromQuery = params.get("asana_connected") === "1";
    const trelloFromQuery = params.get("trello_connected") === "1";
    const clickupFromQuery = params.get("clickup_connected") === "1";
    if (jiraFromQuery) {
      localStorage.setItem(JIRA_CONNECTED_STORAGE_KEY, String(Date.now()));
    }
    if (asanaFromQuery) {
      localStorage.setItem(ASANA_CONNECTED_STORAGE_KEY, String(Date.now()));
    }
    if (trelloFromQuery) {
      localStorage.setItem(TRELLO_CONNECTED_STORAGE_KEY, String(Date.now()));
    }
    if (clickupFromQuery) {
      localStorage.setItem(CLICKUP_CONNECTED_STORAGE_KEY, String(Date.now()));
    }
    setJiraConnected(Boolean(localStorage.getItem(JIRA_CONNECTED_STORAGE_KEY)));
    setAsanaConnected(Boolean(localStorage.getItem(ASANA_CONNECTED_STORAGE_KEY)));
    setTrelloConnected(Boolean(localStorage.getItem(TRELLO_CONNECTED_STORAGE_KEY)));
    setClickUpConnected(Boolean(localStorage.getItem(CLICKUP_CONNECTED_STORAGE_KEY)));
    setJiraList([]);
    setAsanaList([]);
    setTrelloList([]);
    setClickUpList([]);
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    })();
  }, [open, asPage]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "RESOSYNCER_JIRA_CONNECTED") {
        if (e.data.ok) {
          localStorage.setItem(JIRA_CONNECTED_STORAGE_KEY, String(Date.now()));
          setJiraConnected(true);
          message.success("Jira connected. You can now load projects.");
        } else {
          message.error(e.data.error || "Jira connection failed.");
        }
      }
      if (e.data?.type === "RESOSYNCER_ASANA_CONNECTED") {
        if (e.data.ok) {
          localStorage.setItem(ASANA_CONNECTED_STORAGE_KEY, String(Date.now()));
          setAsanaConnected(true);
          message.success("Asana connected. You can now load projects.");
        } else {
          message.error(e.data.error || "Asana connection failed.");
        }
      }
      if (e.data?.type === "RESOSYNCER_TRELLO_CONNECTED") {
        if (e.data.ok) {
          localStorage.setItem(TRELLO_CONNECTED_STORAGE_KEY, String(Date.now()));
          setTrelloConnected(true);
          message.success("Trello connected. You can now load boards.");
        } else {
          message.error(e.data.error || "Trello connection failed.");
        }
      }
      if (e.data?.type === "RESOSYNCER_CLICKUP_CONNECTED") {
        if (e.data.ok) {
          localStorage.setItem(CLICKUP_CONNECTED_STORAGE_KEY, String(Date.now()));
          setClickUpConnected(true);
          message.success("ClickUp connected. You can now load lists.");
        } else {
          message.error(e.data.error || "ClickUp connection failed.");
        }
      }
    };
    const onStorage = (e) => {
      if (e.key === JIRA_CONNECTED_STORAGE_KEY && e.newValue) {
        setJiraConnected(true);
      }
      if (e.key === ASANA_CONNECTED_STORAGE_KEY && e.newValue) {
        setAsanaConnected(true);
      }
      if (e.key === TRELLO_CONNECTED_STORAGE_KEY && e.newValue) {
        setTrelloConnected(true);
      }
      if (e.key === CLICKUP_CONNECTED_STORAGE_KEY && e.newValue) {
        setClickUpConnected(true);
      }
    };
    const onJiraConnected = () => setJiraConnected(true);
    const onAsanaConnected = () => setAsanaConnected(true);
    const onTrelloConnected = () => setTrelloConnected(true);
    const onClickUpConnected = () => setClickUpConnected(true);
    window.addEventListener("message", onMsg);
    window.addEventListener("storage", onStorage);
    window.addEventListener("jiraConnected", onJiraConnected);
    window.addEventListener("asanaConnected", onAsanaConnected);
    window.addEventListener("trelloConnected", onTrelloConnected);
    window.addEventListener("clickupConnected", onClickUpConnected);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jiraConnected", onJiraConnected);
      window.removeEventListener("asanaConnected", onAsanaConnected);
      window.removeEventListener("trelloConnected", onTrelloConnected);
      window.removeEventListener("clickupConnected", onClickUpConnected);
    };
  }, []);

  const openTrelloAuth = useCallback(() => {
    const returnTo = `${window.location.origin}/projects?trello_connected=1`;
    window.location.assign(getTrelloBackendAuthUrl(returnTo));
  }, []);

  const openClickUpAuth = useCallback(() => {
    const returnTo = `${window.location.origin}/projects?clickup_connected=1`;
    window.location.assign(getClickUpBackendAuthUrl(returnTo));
  }, []);

  const card = useMemo(
    () => ({
      background: isDark ? "var(--p-card)" : "#ffffff",
      border: `1px solid ${isDark ? "var(--p-border)" : "rgba(15,23,42,0.08)"}`,
      borderRadius: 14,
      color: "var(--p-text)",
    }),
    [isDark],
  );

  const muted = "var(--p-muted)";
  const accent = "#3453b7";

  const verifyJira = async () => {
    setJiraLoading(true);
    try {
      const list = await listJiraProjectsViaBackend();
      console.log("[Jira] Fetched projects:", list);
      setJiraList(list);
      setRemoteItems(
        list.map((p) => ({
          id: p.key,
          label: `${p.name} (${p.key})`,
          meta: p,
        })),
      );
      setSelectedIds(new Set(list.map((p) => p.key)));
      setJiraConnected(true);
      localStorage.setItem(JIRA_CONNECTED_STORAGE_KEY, String(Date.now()));
      message.success(`Found ${list.length} Jira projects`);
      if (list.length > 0) setStep(3);
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        message.error("Connect Jira first, then load projects again.");
      } else {
        message.error(msg || "Could not load Jira projects");
      }
    } finally {
      setJiraLoading(false);
    }
  };

  const openJiraAuth = useCallback(() => {
    const authStart = "/integrations/jira";
    window.location.assign(authStart);
  }, []);

  const openAsanaAuth = useCallback(() => {
    const returnTo = `${window.location.origin}/projects?asana_connected=1`;
    window.location.assign(getAsanaBackendAuthUrl(returnTo));
  }, []);

  const verifyAsana = async () => {
    setAsanaLoading(true);
    try {
      const list = await listAsanaProjectsViaBackend();
      console.log("[Asana] Fetched projects list:", list);
      setAsanaList(list);
      setRemoteItems(
        list.map((p) => ({
          id: p.gid,
          label: `${p.name}${p.workspaceName ? ` - ${p.workspaceName}` : ""}`,
          meta: p,
        })),
      );
      setSelectedIds(new Set(list.map((p) => p.gid)));
      setAsanaConnected(true);
      localStorage.setItem(ASANA_CONNECTED_STORAGE_KEY, String(Date.now()));
      message.success(`Found ${list.length} Asana projects`);
      if (list.length > 0) setStep(3);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Could not load Asana");
    } finally {
      setAsanaLoading(false);
    }
  };

  const verifyTrelloBoards = async () => {
    setTrelloLoading(true);
    try {
      const boards = await listTrelloProjectsViaBackend();
      setTrelloList(boards);
      setRemoteItems(
        boards.map((b) => ({
          id: b.id,
          label: `${b.name}${b.workspaceName ? ` - ${b.workspaceName}` : ""}`,
          meta: b,
        })),
      );
      setSelectedIds(new Set(boards.map((b) => b.id)));
      setTrelloConnected(true);
      localStorage.setItem(TRELLO_CONNECTED_STORAGE_KEY, String(Date.now()));
      message.success(`Found ${boards.length} boards`);
      if (boards.length > 0) setStep(3);
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        message.error("Connect Trello first, then load boards again.");
      } else {
        message.error(msg || "Could not load Trello boards");
      }
    } finally {
      setTrelloLoading(false);
    }
  };

  const verifyClickUpLists = async () => {
    setClickUpLoading(true);
    try {
      const lists = await listClickUpProjectsViaBackend();
      setClickUpList(lists);
      setRemoteItems(
        lists.map((p) => ({
          id: p.id,
          label: `${p.name}${p.workspaceName ? ` - ${p.workspaceName}` : ""}`,
          meta: p,
        })),
      );
      setSelectedIds(new Set(lists.map((p) => p.id)));
      setClickUpConnected(true);
      localStorage.setItem(CLICKUP_CONNECTED_STORAGE_KEY, String(Date.now()));
      message.success(`Found ${lists.length} ClickUp lists`);
      if (lists.length > 0) setStep(3);
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        message.error("Connect ClickUp first, then load lists again.");
      } else {
        message.error(msg || "Could not load ClickUp lists");
      }
    } finally {
      setClickUpLoading(false);
    }
  };

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        if (n.size >= MAX_BULK) {
          message.warning(`Select at most ${MAX_BULK} at once for a smooth import.`);
          return prev;
        }
        n.add(id);
      }
      return n;
    });
  };

  const selectAll = () => {
    const ids = remoteItems.map((r) => r.id).slice(0, MAX_BULK);
    setSelectedIds(new Set(ids));
  };

  const selectNone = () => setSelectedIds(new Set());

  const toAiSampleBundle = (bundle) => {
    const firstIssue = Array.isArray(bundle?.issues) ? bundle.issues[0] : null;
    return {
      source: bundle?.source || source,
      project: bundle?.project || {},
      issues: firstIssue
        ? [
            {
              ...firstIssue,
              comments: Array.isArray(firstIssue.comments)
                ? firstIssue.comments.slice(0, 1)
                : [],
              attachments: Array.isArray(firstIssue.attachments)
                ? firstIssue.attachments.slice(0, 1)
                : [],
            },
          ]
        : [],
      meta: {
        totalIssues: Array.isArray(bundle?.issues) ? bundle.issues.length : 0,
      },
    };
  };

  const mapIssueToTicket = (issue) => {
    const status = String(issue?.status || "open").toLowerCase();
    const normalizedStatus = ["open", "in_progress", "completed", "closed"].includes(status)
      ? status
      : status.includes("progress")
        ? "in_progress"
        : status.includes("done") || status.includes("complete")
          ? "completed"
          : status.includes("close")
            ? "closed"
            : "open";

    const priority = String(issue?.priority || "medium").toLowerCase();
    const normalizedPriority = ["low", "medium", "high", "urgent"].includes(priority)
      ? priority
      : priority.includes("blocker") || priority.includes("highest")
        ? "urgent"
        : priority.includes("high")
          ? "high"
          : priority.includes("low")
            ? "low"
            : "medium";

    const ticketType = String(issue?.ticket_type || "task").toLowerCase();
    const normalizedType = ["task", "story", "bug", "epic", "subtask"].includes(ticketType)
      ? ticketType
      : "task";

    return {
      source: source,
      external_id: issue?.id || issue?.key || null,
      source_issue_key: issue?.key || null,
      assignee_name:
        issue?.assignee_name ||
        issue?.assignee?.displayName ||
        issue?.assignee?.name ||
        issue?.assignee ||
        null,
      assignee_email:
        issue?.assignee_email ||
        issue?.assignee?.email ||
        issue?.assignee?.mail ||
        null,
      assignee_username:
        issue?.assignee_username ||
        issue?.assignee?.username ||
        issue?.assignee?.userName ||
        null,
      title: issue?.title || issue?.key || "Untitled",
      description: issue?.description || "",
      status: normalizedStatus,
      priority: normalizedPriority,
      ticket_type: normalizedType,
      comments: Array.isArray(issue?.comments)
        ? issue.comments.map((c) => ({
            author: c?.author || "User",
            body: c?.body || "",
          }))
        : [],
      attachments: Array.isArray(issue?.attachments)
        ? issue.attachments
            .filter((a) => a?.url)
            .map((a) => ({
              name: a?.name || "attachment",
              url: a.url,
            }))
        : [],
    };
  };

  const runAiMapping = async () => {
    if (!tenantId || !userId) {
      message.error("Sign in required.");
      return;
    }
    if (!groq) {
      message.error("AI is not configured (Groq API key).");
      return;
    }

    setMapping(true);
    setMappedPayload(null);
    setMapProgress("");

    try {
      const parseAiSafely = (raw, contextLabel) => {
        try {
          return parseAiJsonResponse(raw);
        } catch (err) {
          console.error(`[AI Mapping] Failed to parse JSON (${contextLabel})`);
          console.error("[AI Mapping] Raw AI response:", raw);
          throw err;
        }
      };

      const projectsOut = [];

      const ids = [...selectedIds];
      if (!ids.length) throw new Error("Select at least one project");

      const bundles = [];
      if (source === "jira") {
        for (let i = 0; i < ids.length; i++) {
          const key = ids[i];
          setMapProgress(`Fetching Jira ${i + 1}/${ids.length}...`);
          bundles.push(
            await fetchJiraBundleViaBackend({
              projectKey: key,
            }),
          );
          const latestBundle = bundles[bundles.length - 1];
          console.log("[Jira] Fetched bundle:", {
            projectKey: key,
            issues: latestBundle?.issues?.length || 0,
            project: latestBundle?.project?.name || key,
          });
        }
      } else if (source === "asana") {
        for (let i = 0; i < ids.length; i++) {
          const gid = ids[i];
          setMapProgress(`Fetching Asana ${i + 1}/${ids.length}…`);
          const fetchedBundle = await fetchAsanaBundleViaBackend({
            projectGid: gid,
          });
          const selectedProject = remoteItems.find((r) => r.id === gid)?.meta;
          const selectedProjectName = selectedProject?.name || "";
          const fetchedProjectName = fetchedBundle?.project?.name || "";
          const resolvedProjectName =
            fetchedProjectName && fetchedProjectName !== "Imported Asana project"
              ? fetchedProjectName
              : selectedProjectName || fetchedProjectName || "Imported Asana project";
          bundles.push({
            ...fetchedBundle,
            project: {
              ...(fetchedBundle?.project || {}),
              name: resolvedProjectName,
            },
          });
          const latestBundle = bundles[bundles.length - 1];
          console.log("[Asana] Fetched bundle:", {
            projectGid: gid,
            project: latestBundle?.project || null,
            ticketsCount: latestBundle?.issues?.length || 0,
            tickets: latestBundle?.issues || [],
          });
        }
      } else if (source === "trello") {
        for (let i = 0; i < ids.length; i++) {
          const bid = ids[i];
          setMapProgress(`Fetching Trello ${i + 1}/${ids.length}...`);
          bundles.push(await fetchTrelloBundleViaBackend({ boardId: bid }));
          const latestBundle = bundles[bundles.length - 1];
          console.log("[Trello] Fetched bundle:", {
            boardId: bid,
            project: latestBundle?.project || null,
            ticketsCount: latestBundle?.issues?.length || 0,
            tickets: latestBundle?.issues || [],
          });
        }
      } else if (source === "clickup") {
        for (let i = 0; i < ids.length; i++) {
          const listId = ids[i];
          setMapProgress(`Fetching ClickUp ${i + 1}/${ids.length}...`);
          bundles.push(await fetchClickUpBundleViaBackend({ projectId: listId }));
          const latestBundle = bundles[bundles.length - 1];
          console.log("[ClickUp] Fetched bundle:", {
            projectId: listId,
            project: latestBundle?.project || null,
            ticketsCount: latestBundle?.issues?.length || 0,
            tickets: latestBundle?.issues || [],
          });
        }
      }

      for (let i = 0; i < bundles.length; i++) {
        setMapProgress(`AI mapping ${i + 1} of ${bundles.length}…`);
        const aiSampleBundle = toAiSampleBundle(bundles[i]);
        const prompt = buildAiPromptForMapping(source, aiSampleBundle);
        const ai = await groq(
          "You output only valid JSON for migration. No markdown fences.",
          prompt,
          { maxTokens: 4096 },
        );
        const parsed = parseAiSafely(ai, `${source}-bundle-${i + 1}`);
        const originalProjectName = bundles[i]?.project?.name;
        const finalProjectName =
          source === "asana"
            ? originalProjectName || "Imported project"
            : parsed?.project?.name || originalProjectName || "Imported project";
        const mappedTickets = Array.isArray(bundles[i]?.issues)
          ? bundles[i].issues.map(mapIssueToTicket)
          : [];
        projectsOut.push({
          project: {
            name: finalProjectName,
            description:
              parsed?.project?.description ||
              bundles[i]?.project?.description ||
              "",
            client_name: parsed?.project?.client_name || null,
            client_email: parsed?.project?.client_email || null,
            status: parsed?.project?.status || "planning",
          },
          tickets: mappedTickets,
        });
      }

      setMappedPayload({ projects: projectsOut });
      setMapProgress("");
      message.success("Ready to import");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Mapping failed");
    } finally {
      setMapping(false);
    }
  };

  const handleImportNow = async () => {
    if (!tenantId || !userId) return;
    const { projects } = normalizeMappedPayload(mappedPayload);
    if (!projects.length) {
      message.error("Run AI mapping first.");
      return;
    }
    setImporting(true);
    try {
      const { projectIds, warnings } = await executeBulkMappedImport({
        supabase,
        tenantId,
        userId,
        mapped: mappedPayload,
      });

      let sprintBootstrapped = 0;
      if (createSprintAfterImport) {
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 14);
        const fmt = (d) => d.toISOString().slice(0, 10);

        for (const projectId of projectIds || []) {
          const { count: backlogCount, error: countErr } = await supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("project_id", projectId)
            .is("sprint_id", null);

          if (countErr) continue;
          if (!backlogCount) continue;

          const { data: sprintRow, error: sprintErr } = await supabase
            .from("sprints")
            .insert([
              {
                project_id: projectId,
                name: "Imported Sprint 1",
                goal: "Initial sprint created from imported backlog",
                status: "planning",
                start_date: fmt(today),
                end_date: fmt(end),
                created_by: userId,
              },
            ])
            .select("id")
            .single();

          if (sprintErr || !sprintRow?.id) continue;

          const { error: assignErr } = await supabase
            .from("tickets")
            .update({ sprint_id: sprintRow.id })
            .eq("project_id", projectId)
            .is("sprint_id", null);

          if (!assignErr) sprintBootstrapped += 1;
        }
      }

      message.success(
        projects.length > 1
          ? `Imported ${projects.length} projects`
          : "Project imported",
      );
      if (sprintBootstrapped > 0) {
        message.success(
          `Created and assigned an initial sprint for ${sprintBootstrapped} imported project(s).`,
        );
      }
      if (Array.isArray(warnings) && warnings.length > 0) {
        const failedCount = warnings.reduce(
          (n, w) => n + (Number(w?.count) || 0),
          0,
        );
        message.warning(
          `${failedCount} attachment(s) could not be synced from external source. Import succeeded with partial attachments.`,
          6,
        );
      }
      onImported?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const canGoStep2 = source;
  const canGoStep3 = useMemo(() => {
    if (source === "jira") return jiraList.length > 0;
    if (source === "asana") return asanaList.length > 0;
    if (source === "trello") return trelloList.length > 0;
    if (source === "clickup") return clickUpList.length > 0;
    return false;
  }, [source, jiraList, asanaList, trelloList, clickUpList]);

  const nextFromStep2 = () => setStep(3);

  const nextFromStep3 = () => {
    if (!selectedIds.size) {
      message.error("Select at least one project");
      return;
    }
    setStep(4);
  };

  const summary = useMemo(() => {
    const { projects } = normalizeMappedPayload(mappedPayload);
    if (!projects.length) return null;
    const tickets = projects.reduce(
      (n, p) => n + (p.tickets?.length || 0),
      0,
    );
    return { projects: projects.length, tickets };
  }, [mappedPayload]);

  return (
    <Modal
      title={null}
      open={asPage ? true : open}
      onCancel={onClose}
      width={asPage ? 1100 : 920}
      footer={null}
      destroyOnClose
      mask={!asPage}
      closable={!asPage}
      centered
      style={
        asPage
          ? {
              maxWidth: 1100,
              margin: "0 auto",
            }
          : undefined
      }
      styles={{
        mask: asPage
          ? undefined
          : {
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              background: isDark
                ? "rgba(12, 16, 30, 0.42)"
                : "rgba(241, 245, 255, 0.38)",
            },
        content: {
          padding: 0,
          borderRadius: asPage ? 18 : 16,
          overflow: "hidden",
          background: isDark ? "var(--p-card)" : "#fafbfc",
        },
      }}
    >
      <div
        className="project-import-surface"
        style={{
          fontFamily: "'DM Sans',sans-serif",
          color: "var(--p-text)",
          borderBottom: `1px solid ${isDark ? "var(--p-border)" : "rgba(15,23,42,0.06)"}`,
          padding: "20px 24px 16px",
          background: isDark ? "var(--p-card2)" : "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${accent} 0%, #6366f1 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Download size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
                Import projects
              </div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                Connect, select everything you need, map with AI, import in one go
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: step >= s.id ? accent : muted,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      step > s.id
                        ? accent
                        : step === s.id
                          ? `${accent}33`
                          : isDark
                            ? "var(--p-hover)"
                            : "#e2e8f0",
                    color:
                      step > s.id ? "#fff" : step === s.id ? accent : muted,
                    fontSize: 11,
                  }}
                >
                  {step > s.id ? <Check size={12} /> : s.id}
                </span>
                <span className="hide-mobile">{s.label}</span>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={12} color={muted} style={{ opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 24px 26px", minHeight: 380 }}>
        {step === 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSource(s.id);
                  setStep(2);
                }}
                style={{
                  textAlign: "left",
                  padding: "16px 16px",
                  borderRadius: 14,
                  border:
                    source === s.id
                      ? `2px solid ${s.accent}`
                      : `1px solid ${isDark ? "var(--p-border)" : "rgba(15,23,42,0.08)"}`,
                  background: s.bg,
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  color: "var(--p-text)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {s.logo}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "var(--p-text)",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: muted, lineHeight: 1.4 }}>
                  {s.subtitle}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            {source === "jira" && (
              <div style={{ display: "grid", gap: 12 }}>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.55, margin: 0 }}>
                  Connect Jira through your backend OAuth endpoints. No Jira base URL is required in this form.
                </p>
                <div
                  style={{
                    ...card,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: muted,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    Status:{" "}
                    <span style={{ color: jiraConnected ? "#16a34a" : "#f59e0b", fontWeight: 700 }}>
                      {jiraConnected ? "Connected" : "Not connected yet"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!jiraConnected && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={openJiraAuth}
                      style={{ borderRadius: 10, fontWeight: 700, height: 44 }}
                    >
                      Connect Jira
                    </Button>
                  )}
                  <Button
                    size="large"
                    loading={jiraLoading}
                    onClick={verifyJira}
                    style={{ borderRadius: 10, height: 44 }}
                  >
                    Load Jira projects
                  </Button>
                  {jiraConnected && (
                    <Button
                      size="large"
                      onClick={() => {
                        localStorage.removeItem(JIRA_CONNECTED_STORAGE_KEY);
                        setJiraConnected(false);
                        setJiraList([]);
                        setRemoteItems([]);
                        setSelectedIds(new Set());
                        message.info("Jira connection status cleared in this browser.");
                      }}
                      style={{ borderRadius: 10, height: 44 }}
                    >
                      Clear status
                    </Button>
                  )}
                </div>
              </div>
            )}

            {source === "asana" && (
              <div style={{ display: "grid", gap: 12 }}>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.55, margin: 0 }}>
                  Connect Asana through backend OAuth, then load projects into
                  Ryzent.
                </p>
                <div
                  style={{
                    ...card,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: muted,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    Status:{" "}
                    <span style={{ color: asanaConnected ? "#16a34a" : "#f59e0b", fontWeight: 700 }}>
                      {asanaConnected ? "Connected" : "Not connected yet"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!asanaConnected && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={openAsanaAuth}
                      style={{ borderRadius: 10, fontWeight: 700, height: 44 }}
                    >
                      Connect Asana
                    </Button>
                  )}
                  <Button
                    size="large"
                    loading={asanaLoading}
                    onClick={verifyAsana}
                    style={{ borderRadius: 10, height: 44 }}
                  >
                    Load projects
                  </Button>
                  {asanaConnected && (
                    <Button
                      size="large"
                      onClick={() => {
                        localStorage.removeItem(ASANA_CONNECTED_STORAGE_KEY);
                        setAsanaConnected(false);
                        setAsanaList([]);
                        setRemoteItems([]);
                        setSelectedIds(new Set());
                        message.info("Asana connection status cleared in this browser.");
                      }}
                      style={{ borderRadius: 10, height: 44 }}
                    >
                      Clear status
                    </Button>
                  )}
                </div>
              </div>
            )}

            {source === "trello" && (
              <div style={{ display: "grid", gap: 14 }}>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.55, margin: 0 }}>
                  Connect Trello through backend OAuth, then load boards into
                  Ryzent.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!trelloConnected && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={openTrelloAuth}
                      style={{ borderRadius: 10, fontWeight: 700, height: 44 }}
                    >
                      Connect Trello
                    </Button>
                  )}
                  <Button
                    size="large"
                    loading={trelloLoading}
                    onClick={verifyTrelloBoards}
                    style={{ borderRadius: 10, height: 44 }}
                  >
                    Load boards
                  </Button>
                  {trelloConnected && (
                    <Button
                      size="large"
                      onClick={() => {
                        localStorage.removeItem(TRELLO_CONNECTED_STORAGE_KEY);
                        setTrelloConnected(false);
                        setTrelloList([]);
                        setRemoteItems([]);
                        setSelectedIds(new Set());
                        message.info("Trello connection status cleared in this browser.");
                      }}
                      style={{ borderRadius: 10, height: 44 }}
                    >
                      Clear status
                    </Button>
                  )}
                </div>
                {trelloConnected && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={14} /> Trello connected
                  </div>
                )}
              </div>
            )}

            {source === "clickup" && (
              <div style={{ display: "grid", gap: 14 }}>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.55, margin: 0 }}>
                  Connect ClickUp through backend OAuth, then load lists into
                  Ryzent.
                </p>
                <div
                  style={{
                    ...card,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: muted,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    Status:{" "}
                    <span
                      style={{ color: clickUpConnected ? "#16a34a" : "#f59e0b", fontWeight: 700 }}
                    >
                      {clickUpConnected ? "Connected" : "Not connected yet"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {!clickUpConnected && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={openClickUpAuth}
                      style={{ borderRadius: 10, fontWeight: 700, height: 44 }}
                    >
                      Connect ClickUp
                    </Button>
                  )}
                  <Button
                    size="large"
                    loading={clickUpLoading}
                    onClick={verifyClickUpLists}
                    style={{ borderRadius: 10, height: 44 }}
                  >
                    Load lists
                  </Button>
                  {clickUpConnected && (
                    <Button
                      size="large"
                      onClick={() => {
                        localStorage.removeItem(CLICKUP_CONNECTED_STORAGE_KEY);
                        setClickUpConnected(false);
                        setClickUpList([]);
                        setRemoteItems([]);
                        setSelectedIds(new Set());
                        message.info("ClickUp connection status cleared in this browser.");
                      }}
                      style={{ borderRadius: 10, height: 44 }}
                    >
                      Clear status
                    </Button>
                  )}
                </div>
                {clickUpConnected && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={14} /> ClickUp connected
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 22,
                gap: 10,
              }}
            >
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="primary"
                disabled={!canGoStep3}
                onClick={nextFromStep2}
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Select projects ({selectedIds.size} / {Math.min(remoteItems.length, MAX_BULK)} max)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="small" onClick={selectAll}>
                  Select all
                </Button>
                <Button size="small" onClick={selectNone}>
                  Clear
                </Button>
              </div>
            </div>
            <div
              style={{
                ...card,
                maxHeight: 280,
                overflow: "auto",
                padding: 4,
              }}
              className="custom-scrollbar"
            >
              {remoteItems.map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  <Checkbox
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleId(r.id)}
                  />
                  <LayoutGrid size={16} color={muted} />
                  <span style={{ fontSize: 13, flex: 1 }}>{r.label}</span>
                </label>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Button icon={<ArrowLeft size={16} />} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="primary"
                onClick={nextFromStep3}
                icon={<ArrowRight size={16} />}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {!mappedPayload && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Sparkles
                  size={36}
                  color={accent}
                  style={{ marginBottom: 12, opacity: 0.9, display: "block" }}
                />
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  Map with AI
                </div>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.55, maxWidth: 560, margin: 0 }}>
                  We normalize titles, descriptions, comments, and attachment links
                  into Resosyncer projects. This runs once per selected project.
                </p>
                <Button
                  type="primary"
                  size="large"
                  loading={mapping}
                  onClick={runAiMapping}
                  style={{
                    marginTop: 16,
                    borderRadius: 10,
                    fontWeight: 700,
                    height: 46,
                    minWidth: 220,
                  }}
                >
                  {mapping ? "Working…" : "Run AI mapping"}
                </Button>
                {mapProgress && (
                  <div style={{ marginTop: 16, fontSize: 12, color: muted }}>
                    {mapProgress}
                  </div>
                )}
                {mapping && (
                  <Progress percent={66} status="active" showInfo={false} style={{ marginTop: 12 }} />
                )}
              </div>
            )}

            {mappedPayload && summary && (
              <div>
                <div
                  style={{
                    ...card,
                    padding: "18px 18px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                    Ready to import
                  </div>
                  <div style={{ fontSize: 13, color: muted }}>
                    {summary.projects} project{summary.projects !== 1 ? "s" : ""} ·{" "}
                    {summary.tickets} ticket{summary.tickets !== 1 ? "s" : ""} total
                  </div>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    fontSize: 12.5,
                    color: "var(--p-text)",
                    cursor: "pointer",
                  }}
                >
                  <Checkbox
                    checked={createSprintAfterImport}
                    onChange={(e) => setCreateSprintAfterImport(e.target.checked)}
                  />
                  Create initial sprint and assign imported backlog tickets
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    type="primary"
                    size="large"
                    loading={importing}
                    onClick={handleImportNow}
                    style={{ borderRadius: 10, fontWeight: 700, flex: "1 1 220px" }}
                  >
                    Import all now
                  </Button>
                </div>
                <Button
                  type="link"
                  style={{ marginTop: 8, paddingLeft: 0 }}
                  onClick={() => setMappedPayload(null)}
                >
                  Re-run mapping
                </Button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => {
                  setMappedPayload(null);
                  setStep(3);
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .project-import-surface .ant-btn-primary {
          background: #3453b7 !important;
          border-color: #3453b7 !important;
        }
        .project-import-surface .ant-btn-primary:hover,
        .project-import-surface .ant-btn-primary:focus {
          background: #2f4aa4 !important;
          border-color: #2f4aa4 !important;
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </Modal>
  );
}











