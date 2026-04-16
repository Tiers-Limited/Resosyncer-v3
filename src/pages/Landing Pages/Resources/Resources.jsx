import { useState } from "react";
import {
  BookOpen,
  HelpCircle,
  LifeBuoy,
  MessageSquareText,
  PlayCircle,
  Rocket,
  Search,
  ChevronDown,
  ArrowRight,
  Mail,
  MessageCircle,
  Zap,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const docsLinks = [
  {
    icon: Zap,
    title: "Getting Started Guide",
    desc: "Set up your workspace, team, modules, and first workflows in minutes.",
    tag: "Start here",
  },
  {
    icon: Users,
    title: "Projects & AI Employee Matching",
    desc: "Learn how to create projects and assign work with AI-assisted matching.",
    tag: "Core",
  },
  {
    icon: Calendar,
    title: "Attendance, Meetings & Communication",
    desc: "Manage daily team operations with consistent workflows.",
    tag: "Core",
  },
  {
    icon: AlertCircle,
    title: "Troubleshooting",
    desc: "Fix common audio/video, permissions, and data sync issues.",
    tag: "Support",
  },
];

const tutorials = [
  {
    title: "How to run projects with AI employee matching",
    subtitle: "Planning, assignment, and delivery visibility",
    tag: "Projects",
    color: "from-[#1a2f5e] to-[#2455a8]",
  },
  {
    title: "How to use Leads CRM with AI reminders",
    subtitle: "Lead analysis, prioritization, and follow-up flow",
    tag: "CRM",
    color: "from-[#1e3a5f] to-[#1e6b5e]",
  },
  {
    title: "How to use REXA for AI agentic interviews",
    subtitle: "Recruitment workflow from screening to shortlist",
    tag: "Recruitment",
    color: "from-[#2e1f5e] to-[#1e4a8f]",
  },
];

const blogTopics = [
  { title: "Remote work tips", desc: "Best practices for distributed teams" },
  { title: "Productivity hacks", desc: "Work smarter with AI-powered tools" },
  { title: "AI in operations and recruitment", desc: "How automation changes hiring" },
  { title: "Communication skills", desc: "Async and sync communication patterns" },
];

const changelog = [
  {
    date: "April 2026",
    title: "Projects + Workforce Updates",
    badge: "Latest",
    updates: [
      "AI employee matching improvements",
      "Faster project board performance",
      "Attendance sync reliability fixes",
    ],
  },
  {
    date: "March 2026",
    title: "CRM + Communication Improvements",
    badge: null,
    updates: [
      "Better lead scoring insights",
      "Reminder workflow enhancements",
      "Channel message delivery optimizations",
    ],
  },
  {
    date: "February 2026",
    title: "Recruitment + Documents Release",
    badge: null,
    updates: [
      "REXA interview flow upgrades",
      "Document search improvements",
      "Cross-module bug fixes",
    ],
  },
];

const faqs = [
  {
    q: "Is Ryzent free?",
    a: "Ryzent offers a free trial and multiple paid plans depending on team size and required modules.",
  },
  {
    q: "Do I need to install anything?",
    a: "Most workflows run in-browser. Optional integrations may require setup, but core usage does not.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. Ryzent supports responsive web usage on mobile and tablet for core tasks.",
  },
  {
    q: "Is my data secure?",
    a: "Ryzent uses role-based access controls and secure platform practices to protect account and workspace data.",
  },
];

const TABS = ["Documentation", "Tutorials", "Blog & Updates", "FAQ & Support"];

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-[26px] h-[26px] rounded-[7px] bg-[#e8f0fc] flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-[#194696]" />
      </div>
      <span
        style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
        className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#194696]"
      >
        {label}
      </span>
    </div>
  );
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-shadow duration-200"
      style={{ boxShadow: open ? "0 2px 14px rgba(25,70,150,0.07)" : "none" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
        style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
      >
        <span className="text-sm font-700 text-slate-900 font-bold">{item.q}</span>
        <ChevronDown
          size={16}
          className="text-[#7aaae8] flex-shrink-0 ml-3 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-[13px] leading-[1.7] text-slate-500">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .tab-active { color: #194696 !important; border-bottom-color: #194696 !important; }
        .doc-card:hover { border-color: #7aaae8 !important; box-shadow: 0 4px 18px rgba(25,70,150,0.09); }
        .blog-row:hover { background: #f4f8ff; }
        .tut-card:hover .tut-play { transform: scale(1.1); }
        .support-pill:hover { background: #dce7fb !important; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.72)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      {/* -- HERO -- */}
      <section
        className="pt-[100px] pb-14"
        style={{
          background: "linear-gradient(160deg, #f0f5ff 0%, #dce7fb 55%, #c5d6f5 100%)",
        }}
      >
        <div className="mx-auto max-w-[860px] px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 border border-[rgba(25,70,150,.18)] rounded-full px-4 py-[5px] mb-5">
            <BookOpen size={11} className="text-[#194696]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#194696]">
              Resources
            </span>
          </div>
          <h1 className="text-[clamp(28px,5vw,46px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#0b1220] mb-4">
            Learn faster with{" "}
            <span className="text-[#194696]">Ryzent AI Resources</span>
          </h1>
          <p className="text-[15px] text-slate-600 max-w-[480px] mx-auto leading-[1.7] mb-8">
            Guides, tutorials, updates, and support to help your team onboard quickly and work with confidence.
          </p>
          {/* Search bar */}
          <div className="flex items-center max-w-[440px] mx-auto bg-white border border-[#b0c4e8] rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(25,70,150,0.10)]">
            <Search size={14} className="ml-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search docs, guides, updates-"
              className="flex-1 border-none outline-none px-3 py-3 text-sm bg-transparent placeholder-slate-400"
            />
            <button className="bg-[#194696] hover:bg-[#1a3d80] transition-colors text-white text-[13px] font-bold px-5 py-3">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* -- TABS -- */}
      <div className="sticky top-[64px] z-40 bg-white/90 backdrop-blur-[10px] border-b border-slate-200">
        <div className="mx-auto max-w-[1100px] px-6 flex gap-0 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-4 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === i
                  ? "tab-active border-[#194696] text-[#194696]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* -- MAIN CONTENT -- */}
      <main className="mx-auto max-w-[1100px] px-6 py-12 pb-24">

        {/* -- TAB 0: DOCUMENTATION -- */}
        {activeTab === 0 && (
          <div>
            <SectionHeader icon={BookOpen} label="Help center / Documentation" />
            <p className="mt-2 mb-7 text-[14px] text-slate-500 max-w-[500px] leading-[1.7]">
              Self-serve answers your team can follow without raising a support ticket.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {docsLinks.map(({ icon: Icon, title, desc, tag }) => (
                <div
                  key={title}
                  className="doc-card border border-slate-200 rounded-xl p-5 cursor-pointer transition-all duration-200 bg-white group relative"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-[#e8f0fc] flex items-center justify-center mb-4">
                    <Icon size={16} className="text-[#194696]" />
                  </div>
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#194696] bg-[#e8f0fc] px-2 py-[3px] rounded-full">
                    {tag}
                  </span>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-2 leading-[1.4]">{title}</h3>
                  <p className="text-[12px] text-slate-500 leading-[1.6] mb-4">{desc}</p>
                  <div className="flex items-center gap-1 text-[#194696] text-[12px] font-semibold">
                    Read guide <ArrowRight size={12} className="transition-transform group-hover:translate-x-1 duration-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -- TAB 1: TUTORIALS -- */}
        {activeTab === 1 && (
          <div>
            <SectionHeader icon={PlayCircle} label="Tutorials & Guides" />
            <p className="mt-2 mb-7 text-[14px] text-slate-500 max-w-[500px] leading-[1.7]">
              Short visual guides for projects, people ops, CRM, recruitment, and collaboration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tutorials.map((v) => (
                <article
                  key={v.title}
                  className="tut-card border border-slate-200 rounded-xl overflow-hidden bg-white cursor-pointer transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(25,70,150,0.10)]"
                >
                  <div className={`h-[160px] bg-gradient-to-br ${v.color} relative flex items-center justify-center`}>
                    <div className="tut-play w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-200 shadow-md">
                      <PlayCircle size={22} className="text-[#194696] ml-0.5" />
                    </div>
                    <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-[0.08em] bg-[rgba(25,70,150,0.80)] text-[#c5d6f5] px-2.5 py-1 rounded-full">
                      {v.tag}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[13px] font-bold text-slate-900 leading-[1.45] mb-1.5">{v.title}</p>
                    <p className="text-[12px] text-slate-500">{v.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* -- TAB 2: BLOG + CHANGELOG -- */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Blog */}
            <div>
              <SectionHeader icon={MessageSquareText} label="Blog / Insights" />
              <p className="mt-2 mb-5 text-[14px] text-slate-500 leading-[1.7]">
                Build authority and organic growth with educational content.
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {blogTopics.map((b) => (
                  <div
                    key={b.title}
                    className="blog-row flex items-center justify-between px-5 py-4 cursor-pointer transition-colors duration-150 group"
                  >
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{b.title}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{b.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-[#b0c4e8] group-hover:text-[#194696] flex-shrink-0 ml-3 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
            {/* Changelog */}
            <div>
              <SectionHeader icon={Rocket} label="Product updates / Changelog" />
              <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {changelog.map((entry) => (
                  <div key={entry.title} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#194696]">
                        {entry.date}
                      </span>
                      {entry.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.08em] bg-[#194696] text-white px-2 py-[2px] rounded-full">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 mb-2">{entry.title}</p>
                    <ul className="space-y-1">
                      {entry.updates.map((u) => (
                        <li key={u} className="text-[12px] text-slate-500 flex items-start gap-2">
                          <span className="mt-[5px] w-[5px] h-[5px] rounded-full bg-[#7aaae8] flex-shrink-0" />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- TAB 3: FAQ + SUPPORT -- */}
        {activeTab === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* FAQ */}
            <div>
              <SectionHeader icon={HelpCircle} label="FAQ" />
              <div className="mt-5 space-y-2">
                {faqs.map((item) => (
                  <FaqItem key={item.q} item={item} />
                ))}
              </div>
            </div>
            {/* Support */}
            <div>
              <SectionHeader icon={LifeBuoy} label="Community / Support" />
              <div className="mt-5 border border-slate-200 rounded-xl p-6 bg-white">
                <p className="text-[13px] text-slate-500 mb-5 leading-[1.7]">
                  Reach our team quickly through any channel below.
                </p>
                <div className="flex gap-3 flex-wrap mb-6">
                  <a
                    href="mailto:support@ryzent.ai"
                    className="support-pill flex items-center gap-2 bg-[#e8f0fc] text-[#194696] text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors duration-150 no-underline"
                  >
                    <Mail size={13} />
                    Contact support
                  </a>
                  <a
                    href="mailto:feedback@ryzent.ai"
                    className="support-pill flex items-center gap-2 bg-[#e8f0fc] text-[#194696] text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors duration-150 no-underline"
                  >
                    <MessageCircle size={13} />
                    Leave feedback
                  </a>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
                    Quick feedback
                  </label>
                  {submitted ? (
                    <div className="flex items-center gap-2 text-[13px] text-[#194696] font-semibold py-3">
                      <div className="w-5 h-5 rounded-full bg-[#e8f0fc] flex items-center justify-center">
                        <span className="text-[10px]">-</span>
                      </div>
                      Thanks - your feedback was submitted!
                    </div>
                  ) : (
                    <>
                      <textarea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Share a suggestion, report a problem, or tell us what's working well-"
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[13px] text-slate-800 placeholder-slate-300 outline-none focus:border-[#7aaae8] resize-none transition-colors"
                        style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
                      />
                      <button
                        onClick={() => { if (feedback.trim()) setSubmitted(true); }}
                        className="mt-3 bg-[#194696] hover:bg-[#1a3d80] transition-colors text-white text-[13px] font-bold px-5 py-2.5 rounded-lg"
                      >
                        Submit feedback
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}

