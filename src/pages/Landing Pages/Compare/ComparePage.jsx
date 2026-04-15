import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Layers3,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users2,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const sharedRows = {
  monday: [
    { capability: "Project management", ryzent: "Advanced", rival: "Advanced", win: "tie" },
    { capability: "AI-driven workflows", ryzent: "Built-in across modules", rival: "Mostly rule automation", win: "ryzent" },
    { capability: "Operational coverage", ryzent: "Project + CRM + comms + attendance", rival: "Board-centered workflows", win: "ryzent" },
    { capability: "Cross-team accountability", ryzent: "Native visibility and tracking", rival: "Custom setup required", win: "ryzent" },
    { capability: "Total tool sprawl", ryzent: "Lower", rival: "Higher for full operations", win: "ryzent" },
  ],
  clickup: [
    { capability: "Project management", ryzent: "Advanced", rival: "Advanced", win: "tie" },
    { capability: "Adoption speed", ryzent: "Fast for ops teams", rival: "Can be heavy to configure", win: "ryzent" },
    { capability: "Operational breadth", ryzent: "High", rival: "Workspace dependent", win: "ryzent" },
    { capability: "AI execution value", ryzent: "Workflow and operations oriented", rival: "General assistant features", win: "ryzent" },
    { capability: "Complexity overhead", ryzent: "Lower", rival: "Higher", win: "ryzent" },
  ],
  notion: [
    { capability: "Documentation", ryzent: "Good", rival: "Best-in-class", win: "rival" },
    { capability: "Execution workflows", ryzent: "Purpose-built", rival: "Needs deep setup", win: "ryzent" },
    { capability: "Operational controls", ryzent: "Structured", rival: "Flexible but manual", win: "ryzent" },
    { capability: "AI operations", ryzent: "Execution-centered", rival: "General writing and notes", win: "ryzent" },
    { capability: "Scalable team ops", ryzent: "High", rival: "Moderate", win: "ryzent" },
  ],
  jira: [
    { capability: "Engineering issue tracking", ryzent: "Strong", rival: "Best-in-class", win: "rival" },
    { capability: "Business operations", ryzent: "Native modules", rival: "Limited", win: "ryzent" },
    { capability: "Non-technical team fit", ryzent: "High", rival: "Lower", win: "ryzent" },
    { capability: "Operational visibility", ryzent: "Cross-functional", rival: "Tech workflow focused", win: "ryzent" },
    { capability: "Tool consolidation", ryzent: "High", rival: "Lower", win: "ryzent" },
  ],
};

const compareData = {
  asana: {
    rival: "Asana",
    badge: "2025 Competitive Breakdown",
    headline: "Ryzent vs Asana",
    gradient:
      "linear-gradient(132deg, #eef4ff 0%, #dfeafc 48%, #d2e2f9 100%)",
    summary:
      "Asana handles task planning well, but scaling teams need more than task tracking. Ryzent combines project execution, HR, recruitment, contracts, communication, and AI operations in one platform.",
    heroImages: ["/RyzentvsAsana.png"],
    heroStats: [
      { value: "8/10", label: "Categories won by Ryzent", note: "From the 2025 Asana comparison report" },
      { value: "1", label: "Platform for end-to-end ops", note: "Projects, HR, ATS, contracts, CRM, comms" },
      { value: "6+", label: "Tools typically replaced", note: "When teams consolidate from Asana stacks" },
    ],
    pillars: [
      {
        icon: Sparkles,
        title: "AI that drives operations",
        text: "Lead routing, workflow recommendations, predictive insights, and contract drafting are native capabilities, not disconnected add-ons.",
      },
      {
        icon: Layers3,
        title: "Operational breadth in one place",
        text: "Ryzent brings project management, workforce operations, recruitment, communication, and contracts into one integrated workspace.",
      },
      {
        icon: CircleDollarSign,
        title: "Better cost control",
        text: "Instead of stacking multiple per-seat products around Asana, teams can run on one flat operational platform with fewer pricing surprises.",
      },
    ],
    rows: [
      { capability: "Project management", ryzent: "Advanced", rival: "Advanced", win: "tie" },
      { capability: "AI and automation", ryzent: "Core product capability", rival: "Surface-level productivity AI", win: "ryzent" },
      { capability: "HR and people ops", ryzent: "Built in", rival: "Not native", win: "ryzent" },
      { capability: "Recruitment and ATS", ryzent: "Built in", rival: "Not native", win: "ryzent" },
      { capability: "Contract management", ryzent: "Built in with e-sign support", rival: "Not native", win: "ryzent" },
      { capability: "Internal communications", ryzent: "Built in", rival: "Limited", win: "ryzent" },
      { capability: "Pricing predictability", ryzent: "Flat and consolidated", rival: "Per-seat plus add-ons", win: "ryzent" },
    ],
    pricingPanel: {
      title: "Typical stack cost around Asana",
      estimate: "$3,500-$8,000+/month",
      details: [
        "Asana Business + HR + ATS + e-sign + chat + CRM tools",
        "Common for a 20-person team using separate systems",
        "Higher admin overhead and fragmented data flow",
      ],
    },
    scorecard: [
      { metric: "AI and automation", ryzent: 5, rival: 2 },
      { metric: "Feature breadth", ryzent: 5, rival: 2 },
      { metric: "HR and people ops", ryzent: 5, rival: 0 },
      { metric: "Recruitment", ryzent: 5, rival: 0 },
      { metric: "Contract management", ryzent: 5, rival: 0 },
      { metric: "Pricing value", ryzent: 5, rival: 2 },
      { metric: "Project management", ryzent: 4, rival: 4 },
      { metric: "Scalability", ryzent: 5, rival: 3 },
    ],
    chooseRyzent: [
      "You are scaling and need projects, people, and leads connected",
      "You want one operational source of truth",
      "You want AI to improve business execution, not just task drafting",
      "You want predictable spend with fewer tool subscriptions",
    ],
    chooseRival: [
      "You only need lightweight task tracking",
      "You already have a complete stack and are not consolidating",
      "Your team is small and not planning rapid scale this year",
    ],
  },
  monday: {
    rival: "Monday.com",
    badge: "Execution-First Comparison",
    headline: "Ryzent vs Monday.com",
    gradient:
      "linear-gradient(132deg, #eef4ff 0%, #e1edff 50%, #d4e4ff 100%)",
    summary:
      "Monday.com is flexible for board-based work. Ryzent is better for organizations that want operations, delivery, and AI workflows unified under one system.",
    heroImages: ["/RyzentvsMonday.png"],
    heroStats: [
      { value: "1", label: "Unified operations stack", note: "Projects, communication, CRM, attendance" },
      { value: "Faster", label: "Ops team adoption", note: "Less configuration burden for structured execution" },
      { value: "Lower", label: "Tool fragmentation risk", note: "Fewer disconnected apps to maintain" },
    ],
    pillars: [
      { icon: Layers3, title: "From boards to operations", text: "Ryzent extends beyond planning boards into day-to-day execution and accountability." },
      { icon: Target, title: "Clear operational ownership", text: "Native visibility helps managers track delivery, activity, and follow-through." },
      { icon: Sparkles, title: "AI workflows in context", text: "Automation is aligned to real process flow, not only isolated task rules." },
    ],
    rows: sharedRows.monday,
    pricingPanel: {
      title: "Why teams compare seriously",
      estimate: "Consolidated workflows",
      details: [
        "Ryzent reduces operational hopping between tools",
        "Cross-team modules share the same data model",
        "Less overhead than stitching multiple work apps",
      ],
    },
    scorecard: [
      { metric: "Project planning", ryzent: 4, rival: 4 },
      { metric: "AI workflow depth", ryzent: 5, rival: 3 },
      { metric: "Operational breadth", ryzent: 5, rival: 3 },
      { metric: "Accountability visibility", ryzent: 5, rival: 3 },
      { metric: "Scalable ops structure", ryzent: 5, rival: 4 },
    ],
    chooseRyzent: [
      "You need project execution connected to broader operations",
      "You want less customization and faster structure",
      "You are optimizing for manager visibility and accountability",
    ],
    chooseRival: [
      "You mainly want flexible board customization",
      "Your workflows are heavily board-centric already",
    ],
  },
  clickup: {
    rival: "ClickUp",
    badge: "Clarity over Complexity",
    headline: "Ryzent vs ClickUp",
    gradient:
      "linear-gradient(132deg, #f1f6ff 0%, #e6efff 52%, #d8e6ff 100%)",
    summary:
      "ClickUp offers broad features, but many teams struggle with complexity. Ryzent focuses on practical execution, faster adoption, and stronger operational clarity.",
    heroImages: ["/RyzentvsClickup.png"],
    heroStats: [
      { value: "Faster", label: "Time to value", note: "Structured workflows for operations teams" },
      { value: "Higher", label: "Operational clarity", note: "Less setup required to enforce accountability" },
      { value: "Unified", label: "Cross-team operations", note: "Projects, comms, CRM, attendance in one platform" },
    ],
    pillars: [
      { icon: ShieldCheck, title: "Structured by design", text: "Ryzent gives teams opinionated execution rails that reduce process drift." },
      { icon: Users2, title: "Better cross-team coordination", text: "Shared modules connect departments without deep workspace tuning." },
      { icon: Sparkles, title: "AI for execution", text: "Automation is designed to move work forward, not just summarize it." },
    ],
    rows: sharedRows.clickup,
    pricingPanel: {
      title: "Complexity cost matters",
      estimate: "Lower operational overhead",
      details: [
        "Fewer knobs and less admin burden",
        "Clear defaults improve onboarding speed",
        "Consistent execution model across teams",
      ],
    },
    scorecard: [
      { metric: "Feature practicality", ryzent: 5, rival: 3 },
      { metric: "Adoption speed", ryzent: 5, rival: 3 },
      { metric: "Operational visibility", ryzent: 5, rival: 3 },
      { metric: "Execution AI value", ryzent: 5, rival: 3 },
      { metric: "Project depth", ryzent: 4, rival: 4 },
    ],
    chooseRyzent: [
      "You want execution clarity without tool fatigue",
      "You need consistent processes across teams",
      "You care about adoption speed and accountability",
    ],
    chooseRival: [
      "You prefer highly expansive, highly configurable workspaces",
      "Your team can invest in heavier setup and maintenance",
    ],
  },
  notion: {
    rival: "Notion",
    badge: "Execution vs Documentation",
    headline: "Ryzent vs Notion",
    gradient:
      "linear-gradient(132deg, #f2f7ff 0%, #e8f0ff 52%, #dae8ff 100%)",
    summary:
      "Notion is excellent for notes and docs. Ryzent is built for operational execution with project, CRM, communication, and workforce workflows ready to run.",
    heroImages: ["/RyzentvsNotion.png"],
    heroStats: [
      { value: "Execution", label: "First-class workflow model", note: "Built for operations, not only content" },
      { value: "Higher", label: "Operational control", note: "Role-aware structure for teams" },
      { value: "Native", label: "Business workflow support", note: "Projects, leads, activity, attendance" },
    ],
    pillars: [
      { icon: Target, title: "From docs to decisions", text: "Ryzent turns process intent into accountable execution paths." },
      { icon: Layers3, title: "Operational modules included", text: "Run projects and operations in one place instead of assembling doc databases." },
      { icon: Sparkles, title: "AI that supports outcomes", text: "Automations focus on throughput and execution quality." },
    ],
    rows: sharedRows.notion,
    pricingPanel: {
      title: "When Notion is not enough",
      estimate: "Ops platform required",
      details: [
        "Great docs do not replace operational systems",
        "Manual setup often grows with team scale",
        "Execution tracking needs stronger structure",
      ],
    },
    scorecard: [
      { metric: "Documentation", ryzent: 4, rival: 5 },
      { metric: "Operational execution", ryzent: 5, rival: 3 },
      { metric: "Team controls", ryzent: 5, rival: 3 },
      { metric: "AI workflow utility", ryzent: 5, rival: 3 },
      { metric: "Scalable ops fit", ryzent: 5, rival: 3 },
    ],
    chooseRyzent: [
      "You need teams to execute reliably, not just document",
      "You want stronger operational controls and accountability",
      "You want AI tied to business process outcomes",
    ],
    chooseRival: [
      "Your main requirement is documentation and knowledge management",
      "You are comfortable designing custom operational logic manually",
    ],
  },
  jira: {
    rival: "Jira",
    badge: "Business + Engineering Alignment",
    headline: "Ryzent vs Jira",
    gradient:
      "linear-gradient(132deg, #edf4ff 0%, #e2edff 50%, #d4e3ff 100%)",
    summary:
      "Jira excels for engineering issue tracking. Ryzent is better for broader business operations while still supporting structured project execution.",
    heroImages: ["/RyzentvsJira.png"],
    heroStats: [
      { value: "Broader", label: "Non-engineering fit", note: "Operations, HR, CRM, communication" },
      { value: "Simpler", label: "Business team usability", note: "Lower complexity for cross-functional users" },
      { value: "Unified", label: "Operational coverage", note: "Reduces dependence on multiple side tools" },
    ],
    pillars: [
      { icon: Users2, title: "Cross-functional by default", text: "Ryzent is built for engineering, operations, and business teams together." },
      { icon: ShieldCheck, title: "Operational transparency", text: "Leaders get practical visibility across delivery and team activity." },
      { icon: Sparkles, title: "AI-assisted execution", text: "Automations support process flow beyond technical ticketing." },
    ],
    rows: sharedRows.jira,
    pricingPanel: {
      title: "Why ops teams choose Ryzent",
      estimate: "Business-ready operations",
      details: [
        "Less technical friction for non-engineering functions",
        "Broader native modules than engineering issue tools",
        "Better end-to-end operational continuity",
      ],
    },
    scorecard: [
      { metric: "Engineering issue depth", ryzent: 4, rival: 5 },
      { metric: "Business operations", ryzent: 5, rival: 2 },
      { metric: "Ease for non-technical teams", ryzent: 5, rival: 2 },
      { metric: "Cross-functional visibility", ryzent: 5, rival: 3 },
      { metric: "AI operations value", ryzent: 5, rival: 3 },
    ],
    chooseRyzent: [
      "You need one platform for engineering and business operations",
      "You want easier adoption outside technical teams",
      "You are reducing tool sprawl across departments",
    ],
    chooseRival: [
      "Your workflows are deeply engineering-ticket centered",
      "You prioritize specialized software delivery process controls",
    ],
  },
};

const aliases = {
  "ryzent-vs-asana": "asana",
  "ryzent-vs-monday": "monday",
  "ryzent-vs-monday-com": "monday",
  "ryzent-vs-clickup": "clickup",
  "ryzent-vs-notion": "notion",
  "ryzent-vs-jira": "jira",
};

function Rating({ score }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          size={14}
          className={v <= score ? "fill-[#113477] text-[#113477]" : "text-slate-300"}
        />
      ))}
    </div>
  );
}

function winPill(win, rival) {
  if (win === "ryzent") {
    return <span className="rounded-full bg-[#113477] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Ryzent</span>;
  }
  if (win === "rival") {
    return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700">{rival}</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">Tie</span>;
}

export default function ComparePage() {
  const { slug = "" } = useParams();
  const normalized = (aliases[slug.toLowerCase()] || slug.toLowerCase()).replace(".com", "");
  const data = compareData[normalized];

  if (!data) return <Navigate to="/product" replace />;

  return (
    <div className="cmp-root min-h-screen bg-[#f2f6ff] text-slate-900" style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        .cmp-root { width: 100%; overflow-x: hidden; }
        .cmp-table-wrap { overflow: auto; -webkit-overflow-scrolling: touch; }
        .cmp-table { min-width: 680px; }

        @media (max-width: 900px) {
          .cmp-hero { padding-top: 96px; padding-bottom: 46px; }
          .cmp-hero-grid { gap: 22px; }
          .cmp-hero-image-shell { border-radius: 24px; padding: 10px; }
          .cmp-hero-image-inner { border-radius: 18px; }
        }

        @media (max-width: 640px) {
          .cmp-root { width: 100vw; }
          .cmp-hero { padding-top: 88px; padding-bottom: 28px; }
          .cmp-hero-grid { grid-template-columns: 1fr !important; }
          .cmp-hero-grid > div { min-width: 0; width: 100%; }
          .cmp-page-main { padding-left: 16px; padding-right: 16px; padding-top: 20px; }
          .cmp-hero-inner { padding-left: 16px; padding-right: 16px; }
          .cmp-hero-headline { line-height: 1.08; }
          .cmp-hero-actions { flex-direction: column; align-items: stretch; }
          .cmp-hero-actions a { justify-content: center; text-align: center; }
          .cmp-stat-grid { gap: 12px; grid-template-columns: 1fr !important; }
          .cmp-hero-image-shell { width: 100%; max-width: none; margin: 0; }
          .cmp-hero-image-inner img { width: 100%; height: auto; display: block; }
          .cmp-pillars-grid { grid-template-columns: 1fr; }
          .cmp-final-title { font-size: 26px; }
          .cmp-score-row { grid-template-columns: 1fr !important; }
          .cmp-choose-grid { grid-template-columns: 1fr !important; }
          .cmp-final-actions { flex-direction: column; }
          .cmp-final-actions a { width: 100%; text-align: center; }

          .cmp-feature-title { font-size: 24px; line-height: 1.15; word-break: break-word; }
          .cmp-table { min-width: 0; }
          .cmp-table thead { display: none; }
          .cmp-table tbody tr {
            display: block;
            padding: 8px 12px;
            border-top: 1px solid #ebf1fc;
          }
          .cmp-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            padding: 8px 0;
            border: none;
            font-size: 12px !important;
          }
          .cmp-table tbody td::before {
            content: attr(data-label);
            flex-shrink: 0;
            min-width: 84px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #64748b;
          }
        }
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 bg-white/80 backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1240px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section className="cmp-hero pb-14 pt-28" style={{ background: data.gradient }}>
        <div className="cmp-hero-inner mx-auto grid max-w-[1240px] gap-8 px-6 md:grid-cols-[minmax(0,1fr),minmax(0,490px)] md:px-10 cmp-hero-grid">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c8d8f8] bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#123b7a]">
              <Sparkles size={12} /> {data.badge}
            </p>
            <h1 className="cmp-hero-headline mt-5 text-[clamp(34px,5.3vw,60px)] font-bold leading-[1.02] tracking-[-0.04em] text-[#0f2244]">
              {data.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-slate-700">{data.summary}</p>

            <div className="cmp-hero-actions mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-1 rounded-full bg-[#102a43] px-5 py-2.5 text-[12px] font-bold text-white no-underline"
              >
                Start free trial <ArrowRight size={13} />
              </Link>
              <Link
                to="/product"
                className="rounded-full border border-[#102a43] bg-white px-5 py-2.5 text-[12px] font-bold text-[#102a43] no-underline"
              >
                Explore product
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-5 top-8 h-40 w-40 rounded-full bg-[#84a8ff3b] blur-2xl" />
            <div className="absolute -right-4 bottom-6 h-44 w-44 rounded-full bg-[#79cbff38] blur-2xl" />

            <article className="cmp-hero-image-shell relative rounded-[38px] p-[14px] backdrop-blur-md bg-white/15 ring-1 ring-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.2)]">
              <div className="cmp-hero-image-inner overflow-hidden rounded-[30px] border border-white/60 bg-white/55">
                <img
                  src={data.heroImages[0]}
                  alt={`${data.headline} preview`}
                  className="block h-auto w-full object-contain"
                />
              </div>
            </article>
          </div>
        </div>

        <div className="cmp-stat-grid mx-auto mt-8 grid max-w-[1240px] gap-4 px-6 md:grid-cols-3 md:px-10">
          {data.heroStats.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#ccdaf8] bg-white/90 p-5">
              <p className="text-2xl font-extrabold tracking-[-0.02em] text-[#0f2a55]">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <main className="cmp-page-main mx-auto w-full max-w-[1240px] px-6 pb-20 pt-8 md:px-10">
        <section className="cmp-pillars-grid grid gap-4 md:grid-cols-3">
          {data.pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-3xl border border-[#d7e4fc] bg-white p-6 shadow-[0_12px_30px_rgba(16,42,92,0.08)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#113477] text-white">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-[#13284f]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr),340px]">
          <article className="rounded-[26px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_40px_rgba(21,51,101,0.1)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#102a43]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Feature Breakdown</p>
            </div>
            <h2 className="cmp-feature-title mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-[#13284f]">
              Detailed Comparison: Ryzent vs {data.rival}
            </h2>

            <div className="cmp-table-wrap mt-5 rounded-2xl border border-[#e4ecfb]">
              <table className="cmp-table w-full border-collapse">
                <thead>
                  <tr className="bg-[#f5f8ff]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Capability</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#102a43]">Ryzent</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{data.rival}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.capability} className="border-t border-[#ebf1fc]">
                      <td data-label="Capability" className="px-4 py-3 text-[13px] font-semibold text-slate-700">{row.capability}</td>
                      <td data-label="Ryzent" className="px-4 py-3 text-[13px] text-[#102a43]">{row.ryzent}</td>
                      <td data-label={data.rival} className="px-4 py-3 text-[13px] text-slate-600">{row.rival}</td>
                      <td data-label="Edge" className="px-4 py-3 text-[13px]">{winPill(row.win, data.rival)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[26px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_40px_rgba(21,51,101,0.1)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Value View</p>
            <h3 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#13284f]">{data.pricingPanel.title}</h3>
            <p className="mt-3 rounded-2xl bg-[#edf3ff] px-4 py-3 text-xl font-extrabold tracking-[-0.02em] text-[#113477]">{data.pricingPanel.estimate}</p>

            <ul className="mt-4 space-y-3">
              {data.pricingPanel.details.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#113477]" />
                  {item}
                </li>
              ))}
            </ul>

            <Link to="/register" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#113477] no-underline">
              Start with Ryzent <ChevronRight size={14} />
            </Link>
          </article>
        </section>

        <section className="mt-8 rounded-[26px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_40px_rgba(21,51,101,0.1)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Scorecard</p>
          <h3 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#13284f]">How they compare across key dimensions</h3>

          <div className="mt-5 grid gap-3">
            {data.scorecard.map((row) => (
              <article key={row.metric} className="cmp-score-row grid items-center gap-3 rounded-2xl border border-[#e5edfc] bg-[#f9fbff] p-4 md:grid-cols-[minmax(0,1fr),180px,180px]">
                <p className="text-sm font-semibold text-slate-700">{row.metric}</p>
                <div className="flex items-center justify-between md:justify-start md:gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#102a43]">Ryzent</span>
                  <Rating score={row.ryzent} />
                </div>
                <div className="flex items-center justify-between md:justify-start md:gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{data.rival}</span>
                  <Rating score={row.rival} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cmp-choose-grid mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-[26px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_40px_rgba(21,51,101,0.1)]">
            <h4 className="text-xl font-bold tracking-[-0.02em] text-[#13284f]">Choose Ryzent if...</h4>
            <ul className="mt-4 space-y-3">
              {data.chooseRyzent.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#113477]" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[26px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_40px_rgba(21,51,101,0.1)]">
            <h4 className="text-xl font-bold tracking-[-0.02em] text-[#13284f]">{data.rival} can fit if...</h4>
            <ul className="mt-4 space-y-3">
              {data.chooseRival.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#cfddfb] bg-gradient-to-r from-[#102a43] via-[#123b7a] to-[#174a97] p-7 text-white shadow-[0_18px_45px_rgba(16,42,92,0.3)]">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">Final Take</p>
          <h3 className="cmp-final-title mt-2 text-[30px] font-bold leading-[1.04] tracking-[-0.03em]">
            Ryzent is built for teams that run operations, not only task lists.
          </h3>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-white/90">
            If you are consolidating tools and scaling cross-functional execution, Ryzent provides stronger long-term value with AI-powered workflows and broader operational coverage.
          </p>
          <div className="cmp-final-actions mt-5 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-white px-5 py-2.5 text-[12px] font-bold text-[#123b7a] no-underline">Start free trial</Link>
            <Link to="/pricing" className="rounded-full border border-white/60 px-5 py-2.5 text-[12px] font-bold text-white no-underline">View pricing</Link>
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
