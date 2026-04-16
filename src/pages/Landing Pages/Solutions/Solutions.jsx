import {
  Briefcase,
  CalendarCheck2,
  FileText,
  GraduationCap,
  MessageSquare,
  Radar,
  Sparkles,
  UserCog,
  Users,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

/* --- Data -------------------------------------------------------- */

const solutions = [
  {
    title: "Project Management",
    subtitle: "AI employee matching for better delivery",
    description:
      "Plan and execute projects with clear ownership. Ryzent AI recommends the best-fit team members based on skills, capacity, and priorities.",
    bullets: [
      "AI-assisted task assignment",
      "Workload-aware planning",
      "Timeline and blocker visibility",
    ],
    icon: Briefcase,
    accent: "#194696",
    bg: "#eef4ff",
    tag: "Operations",
  },
  {
    title: "Employee Management",
    subtitle: "One source of truth for your workforce",
    description:
      "Manage org structure, roles, and employee context in one place so leaders and teams operate with clarity.",
    bullets: [
      "Central employee profiles",
      "Role and reporting structure",
      "Manager-friendly operational insights",
    ],
    icon: UserCog,
    accent: "#0f6e56",
    bg: "#eef8f7",
    tag: "People",
  },
  {
    title: "Attendance Tracking",
    subtitle: "Reliable records and real-time visibility",
    description:
      "Track attendance with live updates and clean analytics to improve consistency and policy compliance.",
    bullets: [
      "Live attendance logs",
      "Late and missing trend tracking",
      "Export-ready records",
    ],
    icon: CalendarCheck2,
    accent: "#5f52e9",
    bg: "#f4f2ff",
    tag: "People",
  },
  {
    title: "Meetings",
    subtitle: "AI summaries and action tracking",
    description:
      "Convert meetings into outcomes with automatic summaries, captured decisions, and assigned action items.",
    bullets: [
      "AI meeting summaries",
      "Decisions and actions captured",
      "Clear follow-up ownership",
    ],
    icon: MessageSquare,
    accent: "#c0500a",
    bg: "#fff4ee",
    tag: "Collaboration",
  },
  {
    title: "Leads CRM",
    subtitle: "AI analysis and reminder workflows",
    description:
      "Keep pipeline momentum high with lead intelligence, priority suggestions, and smart follow-up reminders.",
    bullets: [
      "Lead quality analysis",
      "Reminder automation",
      "Pipeline stage control",
    ],
    icon: Radar,
    accent: "#1f8f7a",
    bg: "#edf8ef",
    tag: "Sales",
  },
  {
    title: "Trainings",
    subtitle: "Structured onboarding for new joiners",
    description:
      "Create role-based training paths and track readiness so new team members become productive faster.",
    bullets: [
      "Role-based training tracks",
      "Completion and readiness tracking",
      "Team-level learning visibility",
    ],
    icon: GraduationCap,
    accent: "#6b3fd4",
    bg: "#f8f1ff",
    tag: "People",
  },
  {
    title: "Documents Management",
    subtitle: "Organized, searchable, and controlled",
    description:
      "Store and manage important documents centrally with better access control and reduced information loss.",
    bullets: [
      "Central document repository",
      "Permission-aware access",
      "Faster retrieval and sharing",
    ],
    icon: FileText,
    accent: "#b45309",
    bg: "#fff8ed",
    tag: "Operations",
  },
  {
    title: "Recruitment",
    subtitle: "AI Agentic Interviews with REXA",
    description:
      "Speed up hiring with structured screening and AI agentic interview support powered by REXA.",
    bullets: [
      "Consistent candidate evaluations",
      "Faster shortlist generation",
      "Interview signal summaries",
    ],
    icon: Sparkles,
    accent: "#194696",
    bg: "#f1f4ff",
    tag: "Hiring",
  },
  {
    title: "Communication",
    subtitle: "Direct and channel-based collaboration",
    description:
      "Use direct messaging and team channels to keep decisions transparent, contextual, and easy to find.",
    bullets: [
      "Direct and channel chat",
      "Context-linked updates",
      "Less communication fragmentation",
    ],
    icon: Users,
    accent: "#0369a1",
    bg: "#edf8ff",
    tag: "Collaboration",
  },
];

const platformSteps = [
  {
    step: "01",
    title: "Set up workspace",
    desc: "Configure your teams, org structure, and access roles in minutes.",
  },
  {
    step: "02",
    title: "Activate modules",
    desc: "Turn on only the solutions your team needs - no bloat.",
  },
  {
    step: "03",
    title: "Run AI workflows",
    desc: "Let Ryzent AI assist with matching, summaries, and reminders automatically.",
  },
  {
    step: "04",
    title: "Track outcomes",
    desc: "View results, attendance, pipeline, and readiness from one dashboard.",
  },
];

const benefits = [
  "One system for projects, people, and communication",
  "AI where it actually helps daily execution",
  "Fewer missed follow-ups and decisions",
  "Better visibility for managers and leadership",
];

const useCases = [
  {
    role: "Leadership",
    desc: "One operating view across all teams and departments.",
  },
  {
    role: "HR Teams",
    desc: "People, attendance, and hiring in a single workflow.",
  },
  {
    role: "Operations",
    desc: "Projects, meetings, and documents coordinated seamlessly.",
  },
  {
    role: "Sales & Growth",
    desc: "Lead pipeline with AI-driven reminders and analysis.",
  },
  {
    role: "Distributed Teams",
    desc: "Structured communication that keeps everyone aligned.",
  },
];

/* --- Sub-components ----------------------------------------------- */

function TagBadge({ label }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 100,
        background: "#e8effe",
        color: "#194696",
      }}
    >
      {label}
    </span>
  );
}

/* Live mini-preview cards - actual meaningful UI per module */
function ModulePreview({ title, icon: Icon, accent, bg, bullets }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(0,0,0,0.07)",
        background: bg,
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative ring */}
      <div
        style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: accent,
          opacity: 0.06,
        }}
      />
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.07)",
          padding: "1rem 1.1rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0b1220" }}>
              {title}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#16a34a",
              background: "#dcfce7",
              padding: "2px 8px",
              borderRadius: 100,
            }}
          >
            Live
          </span>
        </div>

        {/* bullet rows as actual list items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bullets.map((b, i) => (
            <div
              key={b}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <CheckCircle2
                size={13}
                style={{ color: accent, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc, isLast }) {
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#194696",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          {step}
        </div>
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 32,
              background: "#d1dff7",
              marginTop: 6,
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 28 }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#0b1220",
            margin: "8px 0 4px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

/* --- Page --------------------------------------------------------- */

export default function SolutionsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const allTags = ["All", ...Array.from(new Set(solutions.map((s) => s.tag)))];
  const filtered =
    activeFilter === "All"
      ? solutions
      : solutions.filter((s) => s.tag === activeFilter);

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        .sol-hero-stat { text-align: center; }
        .sol-hero-stat p:first-child { font-size: 2.25rem; font-weight: 800; color: #194696; margin: 0; line-height: 1; }
        .sol-hero-stat p:last-child  { font-size: 12px; color: #64748b; margin: 6px 0 0; }

        .sol-divider { height: 1px; background: linear-gradient(90deg, transparent, #d1dff7, transparent); margin: 0; border: none; }

        .sol-problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 64px; }
        .sol-problem-card { padding: 32px 36px; border-radius: 20px; }
        .sol-step-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0; }
        .sol-modules-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
        .sol-hero-actions { margin-top: 32px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .sol-hero-action-btn { border-radius: 10px; padding: 12px 26px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .sol-cta-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        .sol-module-row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding: 52px 0; border-bottom: 1px solid #e2e8f0; }
        @media (max-width: 820px) {
          .sol-module-row { grid-template-columns: 1fr; gap: 28px; padding: 36px 0; }
          .sol-module-row .preview-col { order: -1; }
        }

        .sol-filter-btn {
          padding: 7px 18px; border-radius: 100px; font-size: 13px; font-weight: 600;
          border: 1px solid #d1dff7; background: transparent; color: #475569; cursor: pointer;
          transition: all 0.18s ease;
        }
        .sol-filter-btn:hover { background: #eef4ff; border-color: #194696; color: #194696; }
        .sol-filter-btn.active { background: #194696; color: #fff; border-color: #194696; }

        .sol-use-card {
          border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .sol-use-card:hover { border-color: #194696; box-shadow: 0 4px 20px rgba(25,70,150,0.08); }

        .cta-section {
          border-radius: 24px;
          background: linear-gradient(135deg, #0f2a6b 0%, #194696 60%, #1d5bcc 100%);
          padding: 56px 48px;
          position: relative; overflow: hidden;
        }
        @media (max-width: 680px) { .cta-section { padding: 36px 24px; } }
        .cta-section::before {
          content: '';
          position: absolute; right: -80px; top: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .cta-section::after {
          content: '';
          position: absolute; left: -60px; bottom: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        @media (max-width: 980px) {
          .sol-problem-grid { grid-template-columns: 1fr; gap: 16px; margin-bottom: 48px; }
          .sol-problem-card { padding: 22px 20px; }
        }

        @media (max-width: 680px) {
          .sol-step-grid { grid-template-columns: 1fr; gap: 6px; }
          .sol-modules-head { margin-bottom: 20px; }
          .sol-hero-actions { gap: 10px; }
          .sol-hero-action-btn { width: 100%; }
          .sol-cta-actions { flex-direction: column; }
          .sol-cta-actions button { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* -- Navbar ----------------------------------------------- */}
      <div
        className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.82)] backdrop-blur-[14px]"
        style={{ borderBottom: "1px solid rgba(209,223,247,0.6)" }}
      >
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      {/* -- Hero ------------------------------------------------- */}
      <section
        className="sol-hero-section"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, #f4f8ff 40%, #dce7fb 75%, #c2d3f1 100%)",
          paddingTop: 104,
          paddingBottom: 72,
          textAlign: "center",
        }}
      >
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 100,
              background: "#e8effe",
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#194696",
            }}
          >
            <Zap size={12} /> Solutions by Ryzent AI
          </span>

          <h1
            style={{
              marginTop: 20,
              fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#0b1220",
              maxWidth: 680,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            One platform for every layer{" "}
            <span style={{ color: "#194696" }}>of your operation</span>
          </h1>

          <p
            style={{
              marginTop: 20,
              maxWidth: 580,
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: 16,
              lineHeight: 1.75,
              color: "#475569",
            }}
          >
            Ryzent AI connects your teams, workflows, and data - so every
            department works from the same picture, not nine different tools.
          </p>

          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 40,
            }}
          >
            {[
              ["9", "Core modules"],
              ["1", "Unified platform"],
              ["24/7", "Operational visibility"],
            ].map(([n, l]) => (
              <div key={l} className="sol-hero-stat">
                <p>{n}</p>
                <p>{l}</p>
              </div>
            ))}
          </div>

          <div className="sol-hero-actions">
            <button
              className="sol-hero-action-btn"
              style={{
                background: "#194696",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Get started free <ArrowRight size={15} />
            </button>
            <button
              className="sol-hero-action-btn"
              style={{
                background: "transparent",
                color: "#194696",
                border: "1.5px solid #194696",
              }}
            >
              See how it works
            </button>
          </div>
        </div>
      </section>

      <hr className="sol-divider" />

      {/* -- Main Content ----------------------------------------- */}
      <main className="mx-auto w-full max-w-[1150px] px-6 pb-28 pt-14 md:px-10">
        {/* Problem / Solution - side by side */}
        <section className="sol-problem-grid">
          <div
            className="sol-problem-card"
            style={{
              background: "#f8faff",
              border: "1px solid #dce7fb",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#94a3b8",
                margin: "0 0 12px",
              }}
            >
              The problem
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0b1220",
                margin: "0 0 12px",
                lineHeight: 1.25,
              }}
            >
              Disconnected tools create fragmented execution
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: "#64748b",
                margin: 0,
              }}
            >
              Teams juggle separate systems for projects, people, attendance,
              meetings, CRM, training, documents, hiring, and communication.
              Decisions slow down. Accountability gets lost.
            </p>
          </div>
          <div
            className="sol-problem-card"
            style={{
              background: "#eef4ff",
              border: "1px solid #c7d9f7",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#194696",
                margin: "0 0 12px",
              }}
            >
              The solution
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0b1220",
                margin: "0 0 12px",
                lineHeight: 1.25,
              }}
            >
              Ryzent AI unifies your full operating workflow
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: "#374151",
                margin: 0,
              }}
            >
              One connected platform where AI helps with employee-task matching,
              meeting summaries, CRM reminders, and recruitment interviews - all
              visible from a single dashboard.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ marginBottom: 32 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#194696",
                margin: "0 0 8px",
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0b1220",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Up and running in four steps
            </h2>
          </div>
          <div
            className="sol-step-grid"
          >
            {platformSteps.map((s, i) => (
              <StepCard
                key={s.step}
                {...s}
                isLast={i === platformSteps.length - 1}
              />
            ))}
          </div>
        </section>

        <hr className="sol-divider" style={{ marginBottom: 56 }} />

        {/* Module grid */}
        <section>
          <div className="sol-modules-head">
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#194696",
                  margin: "0 0 8px",
                }}
              >
                All solutions
              </p>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0b1220",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Complete module coverage
              </h2>
            </div>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`sol-filter-btn${activeFilter === tag ? " active" : ""}`}
                  onClick={() => setActiveFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            {filtered.map((item, idx) => {
              const Icon = item.icon;
              const isEven = idx % 2 === 0;
              return (
                <div key={item.title} className="sol-module-row">
                  {/* Text col */}
                  <div style={{ order: isEven ? 0 : 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: item.bg,
                          border: `1px solid ${item.accent}22`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: item.accent,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <TagBadge label={item.tag} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: item.accent,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)",
                        fontWeight: 800,
                        color: "#0b1220",
                        margin: "0 0 12px",
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.subtitle}
                    </h3>
                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.75,
                        color: "#475569",
                        margin: "0 0 18px",
                      }}
                    >
                      {item.description}
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {item.bullets.map((b) => (
                        <li
                          key={b}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 14,
                            color: "#374151",
                          }}
                        >
                          <ChevronRight
                            size={14}
                            style={{ color: item.accent, flexShrink: 0 }}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Preview col */}
                  <div
                    className="preview-col"
                    style={{ order: isEven ? 1 : 0 }}
                  >
                    <ModulePreview
                      title={item.title}
                      icon={Icon}
                      accent={item.accent}
                      bg={item.bg}
                      bullets={item.bullets}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="sol-divider" style={{ margin: "64px 0" }} />

        {/* Use cases */}
        <section style={{ marginBottom: 64 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#194696",
              margin: "0 0 8px",
            }}
          >
            Who it's for
          </p>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0b1220",
              margin: "0 0 28px",
              letterSpacing: "-0.02em",
            }}
          >
            Built for every team in the org
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {useCases.map(({ role, desc }) => (
              <div key={role} className="sol-use-card">
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#194696",
                    margin: "0 0 6px",
                  }}
                >
                  {role}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA / Benefits */}
        <section className="cta-section">
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                margin: "0 0 12px",
              }}
            >
              Why Ryzent
            </p>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 28px",
                letterSpacing: "-0.02em",
                maxWidth: 520,
                lineHeight: 1.2,
              }}
            >
              One system. Every team. Full visibility.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginBottom: 36,
              }}
            >
              {benefits.map((b) => (
                <div
                  key={b}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <CheckCircle2
                    size={16}
                    style={{ color: "#93c5fd", flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.6,
                    }}
                  >
                    {b}
                  </span>
                </div>
              ))}
            </div>
            <div className="sol-cta-actions">
              <button
                style={{
                  background: "#fff",
                  color: "#194696",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 28px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Get started free <ArrowRight size={15} />
              </button>
              <button
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderRadius: 10,
                  padding: "13px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                }}
              >
                See how it works
              </button>
            </div>
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}

