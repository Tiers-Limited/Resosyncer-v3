import {
  Briefcase,
  CalendarRange,
  CreditCard,
  FileText,
  MessageSquareMore,
  MonitorPlay,
  Puzzle,
  ReceiptText,
  UserRoundSearch,
} from "lucide-react";

const makeProduct = (section, sectionAccent, item) => ({
  ...item,
  section,
  sectionAccent,
  href: item.href || `/product/${item.slug}`,
});

export const productGroups = [
  {
    key: "operations",
    title: "Operations",
    icon: MonitorPlay,
    iconClass: "bg-gradient-to-b from-[#ffe8ea] to-[#ffd8df] text-[#e04661]",
    sectionAccent: "#e04661",
    links: [
      makeProduct("Operations", "#e04661", {
        label: "Activity Monitor",
        slug: "activity-monitor",
        summary:
          "Track productivity patterns, focus windows, and operational flow without manual oversight.",
        highlights: [
          "Live work visibility by team and role",
          "Pattern-based performance insights",
          "Exportable reports for leadership reviews",
        ],
      }),
      makeProduct("Operations", "#e04661", {
        label: "Attendance",
        slug: "attendance",
        summary:
          "Monitor check-ins, shift behavior, and attendance consistency from one clean timeline.",
        highlights: [
          "Daily attendance pulse by department",
          "Late and missing log anomaly flags",
          "Compliance-friendly attendance history",
        ],
      }),
      makeProduct("Operations", "#e04661", {
        label: "Payroll",
        slug: "payroll",
        summary:
          "Convert attendance and compensation logic into dependable payroll readiness.",
        highlights: [
          "Attendance-backed payroll calculations",
          "Clear monthly summaries and adjustments",
          "Fewer manual payroll reconciliation cycles",
        ],
      }),
    ],
  },
  {
    key: "workflows",
    title: "Workflows",
    icon: Briefcase,
    iconClass: "bg-gradient-to-b from-[#e9f2ff] to-[#dce9ff] text-[#1d6fde]",
    sectionAccent: "#1d6fde",
    links: [
      makeProduct("Workflows", "#1d6fde", {
        label: "Project Management",
        slug: "project-management",
        summary:
          "Plan, assign, and deliver projects with capacity-aware workflows and team clarity.",
        highlights: [
          "Workstream-level planning and ownership",
          "Timeline, blocker, and delivery transparency",
          "AI-ready assignment foundation",
        ],
      }),
      makeProduct("Workflows", "#1d6fde", {
        label: "Meetings",
        slug: "meetings",
        summary:
          "Turn recurring meetings into outcomes with captured decisions and action tracking.",
        highlights: [
          "Meeting records and agenda structure",
          "Decisions and follow-up accountability",
          "Cross-team visibility on meeting outcomes",
        ],
      }),
      makeProduct("Workflows", "#1d6fde", {
        label: "Communication",
        slug: "communication",
        summary:
          "Keep context centralized across channels, announcements, and team conversations.",
        highlights: [
          "Direct and channel communication in one place",
          "Decision context preserved with discussions",
          "Reduced message fragmentation across tools",
        ],
      }),
    ],
  },
  {
    key: "growth",
    title: "Growth",
    icon: UserRoundSearch,
    iconClass: "bg-gradient-to-b from-[#e8fff6] to-[#d9f9eb] text-[#10a371]",
    sectionAccent: "#10a371",
    links: [
      makeProduct("Growth", "#10a371", {
        label: "Recruitment",
        slug: "recruitment",
        summary:
          "Build hiring pipelines that move faster with structured stages and decision support.",
        highlights: [
          "Pipeline view from application to offer",
          "Interview progression and status clarity",
          "Faster shortlisting with cleaner signals",
        ],
      }),
      makeProduct("Growth", "#10a371", {
        label: "Contract Builder",
        slug: "contract-builder",
        summary:
          "Generate and standardize business contracts with reusable templates and workflows.",
        highlights: [
          "Template-backed draft generation",
          "Faster legal-ready contract workflows",
          "Version consistency across teams",
        ],
      }),
      makeProduct("Growth", "#10a371", {
        label: "Requests",
        slug: "requests",
        summary:
          "Organize operational requests with status pipelines and owner-level accountability.",
        highlights: [
          "Unified queue for internal requests",
          "Priority and SLA-aware handling",
          "Clear ownership from intake to closure",
        ],
      }),
    ],
  },
];

export const platformLinks = [
  makeProduct("Platform", "#5b6ad6", {
    label: "Documents",
    slug: "documents",
    icon: FileText,
    iconClass: "text-[#7658f2] bg-[#ede9ff]",
    summary:
      "Centralize business files with secure storage, flexible views, and faster document retrieval.",
    highlights: [
      "Secure document storage with role-based access",
      "List and folder views for organized navigation",
      "Built-in document viewer for quick file review",
    ],
  }),
  makeProduct("Platform", "#1c7dce", {
    label: "Subscriptions",
    slug: "subscriptions",
    href: "/pricing",
    icon: ReceiptText,
    iconClass: "text-[#1c7dce] bg-[#e6f2ff]",
    summary:
      "Manage plans, renewals, and workspace subscription health from a single control point.",
    highlights: [
      "Current plan and renewal visibility",
      "Better billing-state transparency",
      "Upgrade and expansion readiness",
    ],
  }),
  makeProduct("Platform", "#0b8f6d", {
    label: "Leads CRM",
    slug: "leads-crm",
    icon: CreditCard,
    iconClass: "text-[#0b8f6d] bg-[#e1faf1]",
    summary:
      "Capture, organize, and track sales leads through a structured CRM workflow.",
    highlights: [
      "Centralized lead pipeline management",
      "Status-based follow-up tracking",
      "Cleaner handoff from lead to conversion",
    ],
  }),
  makeProduct("Platform", "#0f9a74", {
    label: "Teams",
    slug: "teams",
    icon: Puzzle,
    iconClass: "text-[#0f9a74] bg-[#e2fbf3]",
    summary:
      "Design a clean team structure with ownership, collaboration boundaries, and reporting clarity.",
    highlights: [
      "Department and team grouping",
      "Role-based team visibility",
      "Stronger coordination across units",
    ],
  }),
  makeProduct("Platform", "#d23f8f", {
    label: "Standups",
    slug: "standups",
    icon: CalendarRange,
    iconClass: "text-[#d23f8f] bg-[#ffe6f3]",
    summary:
      "Capture daily momentum with updates that highlight blockers, progress, and accountability.",
    highlights: [
      "Structured async or live standups",
      "Daily blockers surfaced quickly",
      "Progress snapshots for managers",
    ],
  }),
  makeProduct("Platform", "#6a67d8", {
    label: "Support",
    slug: "support",
    icon: MessageSquareMore,
    iconClass: "text-[#6a67d8] bg-[#ececff]",
    summary:
      "Handle issues and requests with reliable support workflows and transparent response tracking.",
    highlights: [
      "Centralized support intake",
      "Status and response-time visibility",
      "Better stakeholder communication",
    ],
  }),
];

export const allProductLinks = [
  ...productGroups.flatMap((group) => group.links),
  ...platformLinks,
];

export const getProductBySlug = (slug) =>
  allProductLinks.find((item) => item.slug === slug);
